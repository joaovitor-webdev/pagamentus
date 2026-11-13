const planoContasService = require('../modules/contabilidade/planoContasService');
const lancamentosService = require('../modules/contabilidade/lancamentosService');

const DEFAULT_ORG = 'org-padrao-001';

class ContabilidadeController {
  async listarContas(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const filtros = req.query;
      const contas = await planoContasService.listarContas(orgId, filtros);
      res.json(contas);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async obterArvore(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const arvore = await planoContasService.obterArvoreContas(orgId);
      res.json(arvore);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async criarConta(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const novaConta = await planoContasService.criarConta(orgId, req.body);
      res.status(201).json(novaConta);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async atualizarConta(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const contaAtualizada = await planoContasService.atualizarConta(req.params.id, orgId, req.body);
      res.json(contaAtualizada);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async desativarConta(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const contaInativada = await planoContasService.desativarConta(req.params.id, orgId);
      res.json(contaInativada);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async ativarConta(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const contaAtivada = await planoContasService.ativarConta(req.params.id, orgId);
      res.json(contaAtivada);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async listarLancamentos(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const lancamentos = await lancamentosService.listarLancamentos(orgId, req.query);
      res.json(lancamentos);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async criarLancamento(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const lancamento = await lancamentosService.criarLancamento(orgId, req.body);
      res.status(201).json(lancamento);
    } catch (err) {
      res.status(err.statusCode || 400).json({
        error: err.message,
        detalhes: err.detalhes || null
      });
    }
  }

  async obterLancamentoPorId(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const lancamento = await lancamentosService.obterLancamentoPorId(req.params.id, orgId);
      if (!lancamento) {
        return res.status(404).json({ error: "Lançamento contábil não encontrado." });
      }
      res.json(lancamento);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new ContabilidadeController();
