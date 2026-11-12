const express = require('express');
const router = express.Router();
const { generateEsocialPayload, generateEsocialTxt } = require('../services/esocialService');
const { maskObject } = require('../services/maskingService');

// GET /api/esocial/preview/:competencia - Pré-visualização dos eventos em JSON
router.get('/preview/:competencia', (req, res) => {
  try {
    const { competencia } = req.params;
    const data = generateEsocialPayload(competencia);
    res.json(maskObject(data, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/esocial/download/:competencia - Download do arquivo estruturado (JSON ou TXT) (RF-054)
router.get('/download/:competencia', (req, res) => {
  try {
    const { competencia } = req.params;
    const format = (req.query.format || 'json').toLowerCase();

    if (format === 'txt') {
      const txtContent = generateEsocialTxt(competencia);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="esocial_${competencia.replace('-', '')}.txt"`);
      return res.send(txtContent);
    } else {
      const jsonData = generateEsocialPayload(competencia);
      const jsonContent = JSON.stringify(jsonData, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="esocial_${competencia.replace('-', '')}.json"`);
      return res.send(jsonContent);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
