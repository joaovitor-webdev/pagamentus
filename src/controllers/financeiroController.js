const financeiroService = require('../modules/financeiro/financeiroService');

const DEFAULT_ORG = 'org-padrao-001';

class FinanceiroController {
  async listarTitulos(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const titulos = await financeiroService.listarTitulos(orgId, req.query);
      res.json(titulos);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async obterTitulo(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const titulo = await financeiroService.obterTituloPorId(req.params.id, orgId);
      if (!titulo) {
        return res.status(404).json({ error: "Título financeiro não encontrado." });
      }
      res.json(titulo);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async criarTitulo(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const novoTitulo = await financeiroService.criarTitulo(orgId, req.body);
      res.status(201).json(novoTitulo);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async baixarParcela(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const tituloAtualizado = await financeiroService.baixarParcela(orgId, req.params.id, req.body);
      res.json(tituloAtualizado);
    } catch (err) {
      res.status(err.statusCode || 400).json({ error: err.message });
    }
  }

  async obterResumo(req, res) {
    try {
      const orgId = req.headers['x-organization-id'] || DEFAULT_ORG;
      const resumo = await financeiroService.obterResumoFinanceiro(orgId);
      res.json(resumo);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new FinanceiroController();
