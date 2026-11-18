import { Router, Request, Response } from 'express';
import { query } from '../db/database';

const router = Router();

// GET /api/company - Consulta dados da empresa / empregador
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const result = await query(
      'SELECT * FROM companies WHERE organization_id = $1 LIMIT 1',
      [orgId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Dados da empresa não encontrados.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/company - Atualiza dados cadastrais e tributários da empresa (restrito a RH/Admin)
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.isRhAdmin) {
      res.status(403).json({
        error: 'Acesso Negado: Apenas gestores com perfil RH/Admin podem atualizar dados cadastrais da empresa.'
      });
      return;
    }

    const orgId = req.organizationId || 1;
    const {
      razao_social,
      nome_fantasia,
      cnpj,
      inscricao_estadual,
      inscricao_municipal,
      cnae_principal,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      cep,
      telefone,
      email,
      responsavel_rh,
      aliquota_fpas,
      aliquota_rat,
      aliquota_fap
    } = req.body;

    if (!razao_social || !cnpj) {
      res.status(400).json({ error: 'Razão Social e CNPJ são campos obrigatórios.' });
      return;
    }

    const updateRes = await query(`
      UPDATE companies
      SET
        razao_social = COALESCE($1, razao_social),
        nome_fantasia = COALESCE($2, nome_fantasia),
        cnpj = COALESCE($3, cnpj),
        inscricao_estadual = COALESCE($4, inscricao_estadual),
        inscricao_municipal = COALESCE($5, inscricao_municipal),
        cnae_principal = COALESCE($6, cnae_principal),
        endereco = COALESCE($7, endereco),
        numero = COALESCE($8, numero),
        bairro = COALESCE($9, bairro),
        cidade = COALESCE($10, cidade),
        uf = COALESCE($11, uf),
        cep = COALESCE($12, cep),
        telefone = COALESCE($13, telefone),
        email = COALESCE($14, email),
        responsavel_rh = COALESCE($15, responsavel_rh),
        aliquota_fpas = COALESCE($16, aliquota_fpas),
        aliquota_rat = COALESCE($17, aliquota_rat),
        aliquota_fap = COALESCE($18, aliquota_fap),
        updated_at = CURRENT_TIMESTAMP
      WHERE organization_id = $19
      RETURNING *
    `, [
      razao_social ? razao_social.trim() : null,
      nome_fantasia ? nome_fantasia.trim() : null,
      cnpj ? cnpj.trim() : null,
      inscricao_estadual || null,
      inscricao_municipal || null,
      cnae_principal || null,
      endereco || null,
      numero || null,
      bairro || null,
      cidade || null,
      uf || null,
      cep || null,
      telefone || null,
      email || null,
      responsavel_rh || null,
      aliquota_fpas !== undefined ? Number(aliquota_fpas) : null,
      aliquota_rat !== undefined ? Number(aliquota_rat) : null,
      aliquota_fap !== undefined ? Number(aliquota_fap) : null,
      orgId
    ]);

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Empresa não encontrada para atualização.' });
      return;
    }

    // Registra na trilha de auditoria
    await query(`
      INSERT INTO payroll_approval_logs (organization_id, competencia, usuario, perfil, acao, detalhes)
      VALUES ($1, 'GERAL', 'Douglas (RH)', 'RH/Admin', 'Atualização Cadastral da Empresa', $2)
    `, [orgId, `Dados da empresa atualizados: ${razao_social} (CNPJ: ${cnpj})`]);

    res.json(updateRes.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
