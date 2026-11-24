import { Request, Response, NextFunction } from 'express';
import { AutenticacaoService } from '../services/AutenticacaoService';
import { SessaoUsuario, UsuarioSistema } from '../models/AutenticacaoModel';

function usuarioSemDadosSensíveis(usuario: UsuarioSistema) {
  const { senhaHash: _senhaHash, mfaSegredo: _mfaSegredo, ...dados } = usuario;
  return dados;
}

function sessaoSemToken(sessao: SessaoUsuario) {
  const { token: _token, ...dados } = sessao;
  return dados;
}

/**
 * Extensão da requisição Express para armazenar dados da sessão autenticada
 */
export interface RequisicaoAutenticada extends Request {
  usuarioAutenticadoId?: string;
  tokenSessao?: string;
}

/**
 * Controller HTTP para Autenticação, Senhas, MFA, Perfis, Permissões e Sessões
 * SPEC-1.4 (RF-075 e RNF-003)
 */
export class AutenticacaoController {
  constructor(private readonly authService: AutenticacaoService) {}

  /**
   * Extrai o token Bearer do cabeçalho Authorization
   */
  private extrairToken(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return '';
    }
    return authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : authHeader.trim();
  }

  /**
   * Middleware que valida se a requisição possui sessão ativa e MFA verificado (CA-2 e CA-4)
   */
  public middlewareSessaoAtiva = async (
    req: RequisicaoAutenticada,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extrairToken(req);
      const { usuario, sessao } = await this.authService.validarSessaoAtiva(token);
      req.usuarioAutenticadoId = usuario.id;
      req.tokenSessao = sessao.token;
      next();
    } catch (erro: any) {
      res.status(401).json({
        sucesso: false,
        erro: erro.message || 'Sessão não autorizada.',
      });
    }
  };

  /**
   * POST /api/auth/usuarios (Cadastro inicial ou administrativo de usuário com validação de senha forte - CA-1)
   */
  public cadastrarUsuario = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const { organizacaoId, perfilId, nome, email, senha, mfaHabilitado, mfaSegredo } = req.body;
      const solicitanteId = req.usuarioAutenticadoId;

      const usuario = await this.authService.cadastrarUsuario(
        {
          organizacaoId,
          perfilId,
          nome,
          email,
          senha,
          mfaHabilitado,
          mfaSegredo,
        },
        solicitanteId
      );

      res.status(201).json({
        sucesso: true,
        dados: usuario,
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * PUT /api/auth/senha (Alteração de senha com validação da política de senhas fortes - CA-1)
   */
  public alterarSenha = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const usuarioId = req.usuarioAutenticadoId!;
      const { senhaAtual, novaSenha } = req.body;

      await this.authService.alterarSenha(usuarioId, senhaAtual, novaSenha);

      res.status(200).json({
        sucesso: true,
        mensagem: 'Senha alterada com sucesso.',
      });
    } catch (erro: any) {
      res.status(400).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * POST /api/auth/login (Autenticação primária com controle de tentativas e exigência de MFA - CA-2 e CA-3)
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;
      const resultado = await this.authService.login(email, senha);

      res.status(200).json({
        sucesso: true,
        dados: resultado,
      });
    } catch (erro: any) {
      const bloqueado = erro.message?.toLowerCase().includes('bloquead');
      res.status(bloqueado ? 429 : 401).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * POST /api/auth/mfa/verificar (Verificação de segundo fator MFA para perfis privilegiados - CA-2)
   */
  public verificarMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extrairToken(req) || req.body.token;
      const { codigoMfa } = req.body;

      const sessao = await this.authService.verificarMfa(token, codigoMfa);

      res.status(200).json({
        sucesso: true,
        dados: sessaoSemToken(sessao),
      });
    } catch (erro: any) {
      const bloqueado = erro.message?.toLowerCase().includes('bloquead');
      res.status(bloqueado ? 429 : 401).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * GET /api/auth/me (Valida sessão ativa e retorna dados do usuário autenticado)
   */
  public obterSessaoAtual = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const token = req.tokenSessao!;
      const { sessao, usuario, perfil } = await this.authService.validarSessaoAtiva(token);

      res.status(200).json({
        sucesso: true,
        dados: {
          sessao: sessaoSemToken(sessao),
          usuario: usuarioSemDadosSensíveis(usuario),
          perfil,
        },
      });
    } catch (erro: any) {
      res.status(401).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * POST /api/auth/logout (Encerra a própria sessão ativa imediatamente - CA-4)
   */
  public logout = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const token = req.tokenSessao!;
      const usuarioId = req.usuarioAutenticadoId!;

      const sessaoEncerrada = await this.authService.encerrarSessao(token, usuarioId);

      res.status(200).json({
        sucesso: true,
        dados: sessaoSemToken(sessaoEncerrada),
      });
    } catch (erro: any) {
      res.status(400).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * DELETE /api/auth/sessoes/:sessaoId (Encerra uma sessão específica por ID - CA-4 e CA-5)
   */
  public encerrarSessaoPorId = async (
    req: RequisicaoAutenticada,
    res: Response
  ): Promise<void> => {
    try {
      const sessaoId = String(req.params.sessaoId);
      const solicitanteId = req.usuarioAutenticadoId!;

      const sessaoEncerrada = await this.authService.encerrarSessao(sessaoId, solicitanteId);

      res.status(200).json({
        sucesso: true,
        dados: sessaoSemToken(sessaoEncerrada),
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * POST /api/admin/perfis (Administração de perfis protegida por permissão - CA-5)
   */
  public criarPerfil = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const solicitanteId = req.usuarioAutenticadoId!;
      const { nome, descricao, privilegiado, permissoes } = req.body;

      const perfil = await this.authService.criarPerfil(
        { nome, descricao, privilegiado, permissoes },
        solicitanteId
      );

      res.status(201).json({
        sucesso: true,
        dados: perfil,
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  /**
   * POST /api/admin/permissoes (Administração de permissões protegida por permissão - CA-5)
   */
  public criarPermissao = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const solicitanteId = req.usuarioAutenticadoId!;
      const { chave, descricao } = req.body;

      const permissao = await this.authService.criarPermissao({ chave, descricao }, solicitanteId);

      res.status(201).json({
        sucesso: true,
        dados: permissao,
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({
        sucesso: false,
        erro: erro.message,
      });
    }
  };

  public listarUsuarios = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const usuarios = await this.authService.listarUsuariosDaOrganizacao(
        req.usuarioAutenticadoId!,
      );
      res.status(200).json({
        sucesso: true,
        dados: usuarios.map(usuarioSemDadosSensíveis),
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarPerfis = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const perfis = await this.authService.listarPerfis(req.usuarioAutenticadoId!);
      res.status(200).json({ sucesso: true, dados: perfis });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarPermissoes = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const permissoes = await this.authService.listarPermissoes(req.usuarioAutenticadoId!);
      res.status(200).json({ sucesso: true, dados: permissoes });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };

  public substituirPermissoesDoPerfil = async (
    req: RequisicaoAutenticada,
    res: Response
  ): Promise<void> => {
    try {
      const permissoes = await this.authService.substituirPermissoesDoPerfil(
        String(req.params.perfilId),
        req.body.permissoes,
        req.usuarioAutenticadoId!,
      );
      res.status(200).json({ sucesso: true, dados: permissoes });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarSessoes = async (req: RequisicaoAutenticada, res: Response): Promise<void> => {
    try {
      const usuarioAlvoId =
        typeof req.query.usuarioId === 'string'
          ? req.query.usuarioId
          : req.usuarioAutenticadoId!;
      const sessoes = await this.authService.listarSessoesAtivas(
        usuarioAlvoId,
        req.usuarioAutenticadoId!,
      );
      res.status(200).json({
        sucesso: true,
        dados: sessoes.map(sessaoSemToken),
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };

  public encerrarTodasSessoes = async (
    req: RequisicaoAutenticada,
    res: Response
  ): Promise<void> => {
    try {
      const usuarioAlvoId =
        typeof req.body.usuarioId === 'string'
          ? req.body.usuarioId
          : req.usuarioAutenticadoId!;
      const sessoes = await this.authService.encerrarSessoesDoUsuario(
        usuarioAlvoId,
        req.usuarioAutenticadoId!,
      );
      res.status(200).json({
        sucesso: true,
        dados: sessoes.map(sessaoSemToken),
      });
    } catch (erro: any) {
      const status = erro.message?.includes('Acesso negado') ? 403 : 400;
      res.status(status).json({ sucesso: false, erro: erro.message });
    }
  };
}
