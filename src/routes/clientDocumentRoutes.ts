import { Router, Request, Response } from 'express';
import { pool } from '../db/database';

const router = Router();

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validExercise(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}$/.test(value);
}

function validCompetence(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

async function audit(
  organizationId: number,
  clientId: number | null,
  documentId: number | null,
  req: Request,
  operation: string,
  result: 'aceito' | 'bloqueado',
  details?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO client_document_audit
      (organization_id, client_id, document_id, user_name, operation, result, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      organizationId,
      clientId,
      documentId,
      String(req.headers['x-user-name'] || req.userRole || 'usuario'),
      operation,
      result,
      details || null
    ]
  );
}

function canManage(req: Request): boolean {
  return req.isRhAdmin === true || req.userRole === 'consulta_assistente';
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const clientId = req.clientId || 1;
  const exercise = req.query.exercise as string | undefined;
  const competence = req.query.competence as string | undefined;
  const type = req.query.type as string | undefined;
  const process = req.query.process as string | undefined;

  if ((exercise && !validExercise(exercise)) || (competence && !validCompetence(competence))) {
    res.status(400).json({ error: 'Filtros de exercício ou competência inválidos.' });
    return;
  }

  try {
    const params: any[] = [organizationId];
    let sql = 'SELECT id, organization_id, client_id, exercise, competence, type, process, file_name, content_type, file_size, status, uploaded_by, created_at, updated_at FROM client_documents WHERE organization_id = $1';

    if (req.userRole === 'cliente') {
      params.push(clientId);
      sql += ` AND client_id = $${params.length}`;
    } else if (req.query.client_id) {
      const requestedClientId = Number(req.query.client_id);
      if (!positiveInteger(requestedClientId)) {
        res.status(400).json({ error: 'Informe um cliente válido.' });
        return;
      }
      params.push(requestedClientId);
      sql += ` AND client_id = $${params.length}`;
    }
    if (exercise) {
      params.push(exercise);
      sql += ` AND exercise = $${params.length}`;
    }
    if (competence) {
      params.push(competence);
      sql += ` AND competence = $${params.length}`;
    }
    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }
    if (process) {
      params.push(process);
      sql += ` AND process = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Falha ao listar documentos do cliente:', error);
    res.status(500).json({ error: 'Não foi possível consultar os documentos.' });
  }
});

router.post('/upload', async (req: Request, res: Response): Promise<void> => {
  if (!canManage(req) && req.userRole !== 'cliente') {
    res.status(403).json({ error: 'Perfil sem permissão para enviar documentos.' });
    return;
  }

  const organizationId = req.organizationId || 1;
  const clientId = req.userRole === 'cliente' ? (req.clientId || 1) : Number(req.body.client_id);
  const {
    exercise,
    competence,
    type,
    process,
    file_name,
    content_type,
    file_content_base64,
    request_id
  } = req.body;

  if (!positiveInteger(clientId)) {
    res.status(400).json({ error: 'Informe um cliente válido.' });
    return;
  }
  if (!validExercise(exercise) || !validCompetence(competence)) {
    res.status(400).json({ error: 'Informe exercício e competência válidos.' });
    return;
  }
  if (!type || typeof type !== 'string' || !file_name || typeof file_name !== 'string'
    || !file_content_base64 || typeof file_content_base64 !== 'string') {
    res.status(400).json({ error: 'Informe tipo, nome do arquivo e conteúdo do documento.' });
    return;
  }

  let fileContent: Buffer;
  try {
    fileContent = Buffer.from(file_content_base64, 'base64');
  } catch (_error) {
    res.status(400).json({ error: 'O conteúdo do arquivo não está em base64 válido.' });
    return;
  }
  if (fileContent.length === 0 || fileContent.length > 10 * 1024 * 1024) {
    res.status(400).json({ error: 'O arquivo deve ter entre 1 byte e 10 MB.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO client_documents
        (organization_id, client_id, exercise, competence, type, process, file_name,
         content_type, file_size, file_content, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, organization_id, client_id, exercise, competence, type, process,
                 file_name, content_type, file_size, status, uploaded_by, created_at, updated_at`,
      [
        organizationId,
        clientId,
        exercise,
        competence,
        type.trim(),
        process || null,
        file_name.trim(),
        content_type || 'application/octet-stream',
        fileContent.length,
        fileContent,
        String(req.headers['x-user-name'] || req.userRole || 'usuario')
      ]
    );
    const document = result.rows[0];

    if (request_id !== undefined) {
      if (!positiveInteger(Number(request_id))) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Informe uma solicitação válida.' });
        return;
      }
      const requestResult = await client.query(
        `UPDATE client_document_requests
         SET document_id = $1, status = 'aguardando_confirmacao', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND organization_id = $3 AND client_id = $4
         RETURNING id`,
        [document.id, Number(request_id), organizationId, clientId]
      );
      if (requestResult.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Solicitação não encontrada para este cliente.' });
        return;
      }
    }

    await client.query(
      `INSERT INTO client_document_audit
        (organization_id, client_id, document_id, user_name, operation, result, details)
       VALUES ($1,$2,$3,$4,'envio','aceito',$5)`,
      [
        organizationId,
        clientId,
        document.id,
        String(req.headers['x-user-name'] || req.userRole || 'usuario'),
        `Arquivo ${document.file_name} enviado`
      ]
    );
    await client.query('COMMIT');
    res.status(201).json(document);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Falha ao enviar documento:', error);
    res.status(500).json({ error: 'Não foi possível enviar o documento.' });
  } finally {
    client.release();
  }
});

router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const clientId = req.clientId || 1;
  const documentId = Number(req.params.id);

  if (!positiveInteger(documentId)) {
    res.status(400).json({ error: 'Documento inválido.' });
    return;
  }

  try {
    let sql = 'SELECT * FROM client_documents WHERE organization_id = $1 AND id = $2';
    const params: any[] = [organizationId, documentId];
    if (req.userRole === 'cliente') {
      sql += ' AND client_id = $3';
      params.push(clientId);
    }
    const result = await pool.query(sql, params);
    if (result.rowCount === 0) {
      await audit(organizationId, req.userRole === 'cliente' ? clientId : null, documentId, req, 'download', 'bloqueado', 'Documento não autorizado');
      res.status(404).json({ error: 'Documento não encontrado ou acesso não autorizado.' });
      return;
    }

    const document = result.rows[0];
    await audit(organizationId, document.client_id, documentId, req, 'download', 'aceito');
    res.setHeader('Content-Type', document.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name.replace(/["\\]/g, '_')}"`);
    res.send(document.file_content);
  } catch (error) {
    console.error('Falha ao realizar download:', error);
    res.status(500).json({ error: 'Não foi possível baixar o documento.' });
  }
});

router.post('/requests', async (req: Request, res: Response): Promise<void> => {
  if (!canManage(req)) {
    res.status(403).json({ error: 'Somente usuários autorizados podem solicitar documentos.' });
    return;
  }
  const organizationId = req.organizationId || 1;
  const clientId = Number(req.body.client_id);
  const { exercise, competence, type, process, title, comments } = req.body;

  if (!positiveInteger(clientId) || !type || !title
    || (exercise && !validExercise(exercise))
    || (competence && !validCompetence(competence))) {
    res.status(400).json({ error: 'Informe cliente, tipo, título e filtros válidos.' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO client_document_requests
        (organization_id, client_id, exercise, competence, type, process, title, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [organizationId, clientId, exercise || null, competence || null, type.trim(), process || null, title.trim(), comments?.trim() || null]
    );
    await audit(organizationId, clientId, null, req, 'solicitacao', 'aceito', `Solicitação ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Falha ao criar solicitação:', error);
    res.status(500).json({ error: 'Não foi possível criar a solicitação.' });
  }
});

router.get('/requests/list', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const clientId = req.clientId || 1;
  try {
    let sql = 'SELECT * FROM client_document_requests WHERE organization_id = $1';
    const params: any[] = [organizationId];
    if (req.userRole === 'cliente') {
      sql += ' AND client_id = $2';
      params.push(clientId);
    }
    sql += ' ORDER BY created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Falha ao listar solicitações:', error);
    res.status(500).json({ error: 'Não foi possível listar as solicitações.' });
  }
});

router.post('/requests/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  if (!canManage(req)) {
    res.status(403).json({ error: 'Somente usuários autorizados podem confirmar recebimento.' });
    return;
  }
  const organizationId = req.organizationId || 1;
  const requestId = Number(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE client_document_requests
       SET status = 'recebido', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [requestId, organizationId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Solicitação não encontrada.' });
      return;
    }
    await audit(organizationId, result.rows[0].client_id, result.rows[0].document_id, req, 'confirmacao_recebimento', 'aceito');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Falha ao confirmar documento:', error);
    res.status(500).json({ error: 'Não foi possível confirmar o recebimento.' });
  }
});

router.post('/requests/:id/correction', async (req: Request, res: Response): Promise<void> => {
  if (!canManage(req)) {
    res.status(403).json({ error: 'Somente usuários autorizados podem solicitar correção.' });
    return;
  }
  if (!req.body.comments || typeof req.body.comments !== 'string') {
    res.status(400).json({ error: 'Informe o comentário da correção.' });
    return;
  }
  const organizationId = req.organizationId || 1;
  try {
    const result = await pool.query(
      `UPDATE client_document_requests
       SET status = 'aguardando_correcao', comments = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [req.body.comments.trim(), req.params.id, organizationId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Solicitação não encontrada.' });
      return;
    }
    await audit(organizationId, result.rows[0].client_id, result.rows[0].document_id, req, 'pedido_correcao', 'aceito', req.body.comments.trim());
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Falha ao solicitar correção:', error);
    res.status(500).json({ error: 'Não foi possível solicitar a correção.' });
  }
});

export default router;
