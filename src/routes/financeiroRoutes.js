const express = require('express');
const router = express.Router();
const controller = require('../controllers/financeiroController');

router.get('/titulos', (req, res) => controller.listarTitulos(req, res));
router.get('/titulos/:id', (req, res) => controller.obterTitulo(req, res));
router.post('/titulos', (req, res) => controller.criarTitulo(req, res));
router.post('/parcelas/:id/baixa', (req, res) => controller.baixarParcela(req, res));
router.get('/resumo', (req, res) => controller.obterResumo(req, res));

module.exports = router;
