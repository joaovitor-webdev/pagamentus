const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/parameters - Lista parâmetros do sistema
router.get('/', (req, res) => {
  try {
    const params = db.prepare('SELECT * FROM system_parameters ORDER BY chave ASC').all();
    res.json(params);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/parameters/:chave - Atualiza valor do parâmetro (restrito a RH/Admin)
router.put('/:chave', (req, res) => {
  try {
    if (!req.isRhAdmin) {
      return res.status(403).json({ error: 'Apenas RH/Admin pode atualizar parâmetros.' });
    }

    const { chave } = req.params;
    const { valor } = req.body;

    if (valor === undefined || isNaN(valor)) {
      return res.status(400).json({ error: 'Valor numérico válido é obrigatório.' });
    }

    db.prepare('UPDATE system_parameters SET valor = ? WHERE chave = ?').run(Number(valor), chave);

    db.prepare(`
      INSERT INTO payroll_approval_logs (competencia, usuario, perfil, acao, detalhes)
      VALUES ('CONFIG', 'Douglas (RH)', 'RH/Admin', 'Alteração de Parâmetro', ?)
    `).run(`Parâmetro ${chave} alterado para ${valor}`);

    res.json({ success: true, chave, valor: Number(valor) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
