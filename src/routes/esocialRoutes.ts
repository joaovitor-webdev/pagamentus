import { Router, Request, Response } from 'express';
import { generateEsocialPayload, generateEsocialTxt } from '../services/esocialService';
import { maskObject } from '../services/maskingService';

const router = Router();

// GET /api/esocial/preview/:competencia - Pré-visualização dos eventos em JSON
router.get('/preview/:competencia', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const competencia = String(req.params.competencia);
    const data = await generateEsocialPayload(competencia, orgId);
    res.json(maskObject(data, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/esocial/download/:competencia - Download do arquivo estruturado (JSON ou TXT)
router.get('/download/:competencia', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.isRhAdmin) {
      res.status(403).json({ error: 'Acesso negado a dados salariais e de saúde.' });
      return;
    }

    const orgId = req.organizationId || 1;
    const competencia = String(req.params.competencia);
    const format = ((req.query.format as string) || 'json').toLowerCase();

    if (format === 'txt') {
      const txtContent = await generateEsocialTxt(competencia, orgId);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="esocial_${competencia.replace('-', '')}.txt"`);
      res.send(txtContent);
    } else {
      const jsonData = await generateEsocialPayload(competencia, orgId);
      const jsonContent = JSON.stringify(jsonData, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="esocial_${competencia.replace('-', '')}.json"`);
      res.send(jsonContent);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
