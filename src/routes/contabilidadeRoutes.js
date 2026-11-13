const express = require('express');
const router = express.Router();
const controller = require('../controllers/contabilidadeController');

// Plano de Contas
router.get('/contas', (req, res) => controller.listarContas(req, res));
router.get('/contas/arvore', (req, res) => controller.obterArvore(req, res));
router.post('/contas', (req, res) => controller.criarConta(req, res));
router.put('/contas/:id', (req, res) => controller.atualizarConta(req, res));
router.patch('/contas/:id/desativar', (req, res) => controller.desativarConta(req, res));
router.patch('/contas/:id/ativar', (req, res) => controller.ativarConta(req, res));

// Lançamentos Contábeis
router.get('/lancamentos', (req, res) => controller.listarLancamentos(req, res));
router.post('/lancamentos', (req, res) => controller.criarLancamento(req, res));
router.get('/lancamentos/:id', (req, res) => controller.obterLancamentoPorId(req, res));

module.exports = router;
