import * as crypto from 'crypto';
import {
  PerfilAcesso,
  PermissaoAcesso,
  ResultadoValidacaoSenha,
  SessaoUsuario,
  UsuarioSistema,
} from '../models/AutenticacaoModel';
import { IAutenticacaoRepository } from '../repositories/AutenticacaoRepository';

/**
 * Serviço de Autenticação, Política de Senhas, MFA, Sessões e Permissões
 * Implementa a SPEC-1.4 (RF-075 e RNF-003)
 */
export class AutenticacaoService {
  private readonly maxTentativasLogin: number;
  private readonly tempoBloqueioMs: number;

  constructor(
    private readonly repo: IAutenticacaoRepository,
    opcoes?: { maxTentativasLogin?: number; tempoBloqueioMs?: number }
  ) {
    this.maxTentativasLogin = opcoes?.maxTentativasLogin ?? 5;
    this.tempoBloqueioMs = opcoes?.tempoBloqueioMs ?? 15 * 60 * 1000; // 15 minutos padrão
  }

  // ============================================================================
  // CA-1: Política de Senhas Fortes e Criptografia de Senha
  // ============================================================================

  /**
   * Valida se uma senha atende à política de senhas fortes (RNF-003 / CA-1):
   * - Mínimo de 8 caracteres
   * - Ao menos 1 letra maiúscula
   * - Ao menos 1 letra minúscula
   * - Ao menos 1 número
   * - Ao menos 1 caractere especial
   */
  public validarPoliticaSenhaForte(senha: string): ResultadoValidacaoSenha {
    const erros: string[] = [];

    if (!senha || senha.length < 8) {
      erros.push('A senha deve possuir no mínimo 8 caracteres.');
    }
    if (!/[A-Z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra maiúscula.');
    }
    if (!/[a-z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra minúscula.');
    }
    if (!/[0-9]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um número.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um caractere especial.');
    }

    return {
      valida: erros.length === 0,
      erros,
    };
  }

  /**
   * Gera hash seguro da senha utilizando scrypt com salt aleatório
   */
  public gerarHashSenha(senha: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Compara uma senha em texto puro com o hash armazenado de forma segura contra timing attacks
   */
  public verificarHashSenha(senha: string, senhaHashArmazenada: string): boolean {
    const partes = senhaHashArmazenada.split(':');
    if (partes.length !== 2) {
      return false;
    }
    const [salt, hashOriginal] = partes;
    const hashCalculado = crypto.scryptSync(senha, salt, 64);
    const bufferOriginal = Buffer.from(hashOriginal, 'hex');

    if (hashCalculado.length !== bufferOriginal.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashCalculado, bufferOriginal);
  }

  // ============================================================================
  // Utilitários de MFA (CA-2)
  // ============================================================================

  /**
   * Gera o código MFA de 6 dígitos esperado para um segredo MFA
   */
  public gerarCodigoMfa(mfaSegredo: string, instanteMs: number = Date.now()): string {
    const contador = BigInt(Math.floor(instanteMs / 30000));
    const mensagem = Buffer.alloc(8);
    mensagem.writeBigUInt64BE(contador);

    const digest = crypto.createHmac('sha1', mfaSegredo).update(mensagem).digest();
    const deslocamento = digest[digest.length - 1] & 0x0f;
    const valor =
      (digest.readUInt32BE(deslocamento) & 0x7fffffff) % 1000000;

    return valor.toString().padStart(6, '0');
  }

  private validarCodigoMfa(mfaSegredo: string, codigoMfa: string, instanteMs: number): boolean {
    const codigoInformado = codigoMfa.trim();
    if (!/^\d{6}$/.test(codigoInformado)) {
      return false;
    }

    for (const deslocamento of [-30000, 0, 30000]) {
      const codigoEsperado = this.gerarCodigoMfa(mfaSegredo, instanteMs + deslocamento);
      const informado = Buffer.from(codigoInformado);
      const esperado = Buffer.from(codigoEsperado);
      if (crypto.timingSafeEqual(informado, esperado)) {
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Administração de Permissões e Perfis (RF-075 / CA-5)
  // ============================================================================

  /**
   * Verifica se um usuário possui determinada permissão através de seu perfil (CA-5)
   */
  public async usuarioPossuiPermissao(usuarioId: string, chavePermissao: string): Promise<boolean> {
    const usuario = await this.repo.buscarUsuarioPorId(usuarioId);
    if (!usuario || !usuario.ativo) {
      return false;
    }

    const perfil = await this.repo.buscarPerfilPorId(usuario.perfilId);
    if (!perfil) {
      return false;
    }

    return perfil.permissoes.includes(chavePermissao);
  }

  /**
   * Exige que o usuário solicitante possua a permissão informada, lançando erro caso não possua (CA-5)
   */
  public async exigirPermissao(solicitanteUsuarioId: string, chavePermissao: string): Promise<void> {
    const permitido = await this.usuarioPossuiPermissao(solicitanteUsuarioId, chavePermissao);
    if (!permitido) {
      throw new Error(`Acesso negado: permissão '${chavePermissao}' exigida.`);
    }
  }

  /**
   * Cadastra uma nova permissão no sistema
   */
  public async criarPermissao(
    dados: { chave: string; descricao: string },
    solicitanteUsuarioId?: string
  ): Promise<PermissaoAcesso> {
    if (solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');
    }

    const chaveNormalizada = dados.chave.trim();
    if (!chaveNormalizada) {
      throw new Error('A chave da permissão é obrigatória.');
    }

    const existente = await this.repo.buscarPermissaoPorChave(chaveNormalizada);
    if (existente) {
      throw new Error(`A permissão '${chaveNormalizada}' já existe.`);
    }

    const novaPermissao: PermissaoAcesso = {
      id: crypto.randomUUID(),
      chave: chaveNormalizada,
      descricao: dados.descricao || '',
      criadoEm: new Date(),
    };

    return this.repo.salvarPermissao(novaPermissao);
  }

  /**
   * Cria um perfil de acesso (podendo ser marcado como privilegiado, o que exige MFA - CA-2)
   */
  public async criarPerfil(
    dados: {
      id?: string;
      nome: string;
      descricao?: string;
      privilegiado?: boolean;
      permissoes?: string[];
    },
    solicitanteUsuarioId?: string
  ): Promise<PerfilAcesso> {
    if (solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');
    }

    const nomeNormalizado = dados.nome.trim();
    if (!nomeNormalizado) {
      throw new Error('O nome do perfil é obrigatório.');
    }

    const existente = await this.repo.buscarPerfilPorNome(nomeNormalizado);
    if (existente) {
      throw new Error(`O perfil '${nomeNormalizado}' já está cadastrado.`);
    }

    const permissoes = dados.permissoes ? [...new Set(dados.permissoes)] : [];
    for (const chavePermissao of permissoes) {
      if (!(await this.repo.buscarPermissaoPorChave(chavePermissao))) {
        throw new Error(`A permissão '${chavePermissao}' não existe.`);
      }
    }

    const novoPerfil: PerfilAcesso = {
      id: dados.id || crypto.randomUUID(),
      nome: nomeNormalizado,
      descricao: dados.descricao || '',
      privilegiado: Boolean(dados.privilegiado),
      permissoes,
      criadoEm: new Date(),
    };

    return this.repo.salvarPerfil(novoPerfil);
  }

  /**
   * Atribui uma permissão a um perfil existente (RF-075 / CA-5)
   */
  public async atribuirPermissaoAoPerfil(
    perfilId: string,
    chavePermissao: string,
    solicitanteUsuarioId?: string
  ): Promise<PerfilAcesso> {
    if (solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');
    }

    const perfil = await this.repo.buscarPerfilPorId(perfilId);
    if (!perfil) {
      throw new Error('Perfil não encontrado.');
    }

    if (!perfil.permissoes.includes(chavePermissao)) {
      perfil.permissoes.push(chavePermissao);
    }

    return this.repo.salvarPerfil(perfil);
  }

  public async substituirPermissoesDoPerfil(
    perfilId: string,
    chavesPermissao: string[],
    solicitanteUsuarioId: string
  ): Promise<PerfilAcesso> {
    await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');

    const perfil = await this.repo.buscarPerfilPorId(perfilId);
    if (!perfil) {
      throw new Error('Perfil não encontrado.');
    }

    const permissoes = [...new Set(chavesPermissao)];
    for (const chavePermissao of permissoes) {
      if (!(await this.repo.buscarPermissaoPorChave(chavePermissao))) {
        throw new Error(`A permissão '${chavePermissao}' não existe.`);
      }
    }

    perfil.permissoes = permissoes;
    return this.repo.salvarPerfil(perfil);
  }

  public async listarPerfis(solicitanteUsuarioId: string): Promise<PerfilAcesso[]> {
    await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');
    return this.repo.listarPerfis();
  }

  public async listarPermissoes(solicitanteUsuarioId: string): Promise<PermissaoAcesso[]> {
    await this.exigirPermissao(solicitanteUsuarioId, 'perfis:administrar');
    return this.repo.listarPermissoes();
  }

  public async listarUsuariosDaOrganizacao(
    solicitanteUsuarioId: string
  ): Promise<UsuarioSistema[]> {
    await this.exigirPermissao(solicitanteUsuarioId, 'usuarios:administrar');

    const solicitante = await this.repo.buscarUsuarioPorId(solicitanteUsuarioId);
    if (!solicitante || !solicitante.ativo) {
      throw new Error('Usuário solicitante inválido.');
    }

    return this.repo.listarUsuariosPorOrganizacao(solicitante.organizacaoId);
  }

  // ============================================================================
  // Administração de Usuários e Alteração de Senha (CA-1 e CA-5)
  // ============================================================================

  /**
   * Cadastra um novo usuário aplicando obrigatoriamente a política de senha forte (CA-1)
   */
  public async cadastrarUsuario(
    dados: {
      id?: string;
      organizacaoId: string;
      perfilId: string;
      nome: string;
      email: string;
      senha: string;
      mfaHabilitado?: boolean;
      mfaSegredo?: string;
    },
    solicitanteUsuarioId?: string
  ): Promise<Omit<UsuarioSistema, 'senhaHash' | 'mfaSegredo'> & { mfaSegredoGerado?: string }> {
    if (solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'usuarios:administrar');
    }

    // 1. Valida política de senhas fortes (CA-1)
    const validacaoSenha = this.validarPoliticaSenhaForte(dados.senha);
    if (!validacaoSenha.valida) {
      throw new Error(`Senha fraca recusada: ${validacaoSenha.erros.join(' ')}`);
    }

    // 2. Verifica existência do perfil
    const perfil = await this.repo.buscarPerfilPorId(dados.perfilId);
    if (!perfil) {
      throw new Error('Perfil informado não existe.');
    }

    // 3. Verifica duplicidade de e-mail
    const emailNormalizado = dados.email.trim().toLowerCase();
    const existente = await this.repo.buscarUsuarioPorEmail(emailNormalizado);
    if (existente) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    // Perfis privilegiados possuem MFA habilitado obrigatoriamente (CA-2)
    const exigirMfa = perfil.privilegiado || Boolean(dados.mfaHabilitado);
    const segredoMfaGerado = exigirMfa && !dados.mfaSegredo
      ? crypto.randomBytes(20).toString('hex')
      : null;
    const mfaSegredo = exigirMfa ? dados.mfaSegredo || segredoMfaGerado : null;

    const novoUsuario: UsuarioSistema = {
      id: dados.id || crypto.randomUUID(),
      organizacaoId: dados.organizacaoId,
      perfilId: dados.perfilId,
      nome: dados.nome.trim(),
      email: emailNormalizado,
      senhaHash: this.gerarHashSenha(dados.senha),
      ativo: true,
      mfaHabilitado: exigirMfa,
      mfaSegredo,
      tentativasFalhas: 0,
      bloqueadoAte: null,
      criadoEm: new Date(),
    };

    const salvo = await this.repo.salvarUsuario(novoUsuario);
    const { senhaHash: _, mfaSegredo: __, ...usuarioSemDadosSensíveis } = salvo;
    return {
      ...usuarioSemDadosSensíveis,
      ...(segredoMfaGerado ? { mfaSegredoGerado: segredoMfaGerado } : {}),
    };
  }

  /**
   * Altera a senha de um usuário exigindo cumprimento da política de senha forte (CA-1)
   */
  public async alterarSenha(
    usuarioId: string,
    senhaAtual: string,
    novaSenha: string
  ): Promise<void> {
    const usuario = await this.repo.buscarUsuarioPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    if (!this.verificarHashSenha(senhaAtual, usuario.senhaHash)) {
      throw new Error('Senha atual incorreta.');
    }

    const validacao = this.validarPoliticaSenhaForte(novaSenha);
    if (!validacao.valida) {
      throw new Error(`Senha fraca recusada: ${validacao.erros.join(' ')}`);
    }

    usuario.senhaHash = this.gerarHashSenha(novaSenha);
    await this.repo.salvarUsuario(usuario);
  }

  // ============================================================================
  // Autenticação, MFA Obrigatório (CA-2) e Limite de Tentativas (CA-3)
  // ============================================================================

  /**
   * Realiza a etapa primária de login (e-mail e senha):
   * - Verifica se o usuário está bloqueado por excesso de tentativas (CA-3)
   * - Em caso de senha inválida, incrementa contador e bloqueia ao atingir limite (CA-3)
   * - Se o perfil for privilegiado, exige etapa complementar de MFA antes de liberar a sessão (CA-2)
   */
  public async login(
    email: string,
    senha: string
  ): Promise<{
    sessaoId: string;
    token: string;
    requerMfa: boolean;
    mfaVerificado: boolean;
    usuarioId: string;
  }> {
    const usuario = await this.repo.buscarUsuarioPorEmail(email);
    if (!usuario || !usuario.ativo) {
      throw new Error('Credenciais inválidas.');
    }

    // Verifica se o usuário está bloqueado por excesso de tentativas (CA-3)
    const agora = new Date();
    if (usuario.bloqueadoAte && usuario.bloqueadoAte > agora) {
      throw new Error(
        'Conta temporariamente bloqueada devido ao excesso de tentativas de login com falha.'
      );
    }

    // Valida a senha
    const senhaCorreta = this.verificarHashSenha(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      usuario.tentativasFalhas += 1;

      if (usuario.tentativasFalhas >= this.maxTentativasLogin) {
        usuario.bloqueadoAte = new Date(agora.getTime() + this.tempoBloqueioMs);
        await this.repo.salvarUsuario(usuario);
        throw new Error(
          'Limite máximo de tentativas atingido. Conta bloqueada temporariamente.'
        );
      }

      await this.repo.salvarUsuario(usuario);
      throw new Error('Credenciais inválidas.');
    }

    // Credenciais primárias corretas -> zera tentativas de falha
    usuario.tentativasFalhas = 0;
    usuario.bloqueadoAte = null;
    await this.repo.salvarUsuario(usuario);

    // Verifica se o perfil exige MFA obrigatório (CA-2)
    const perfil = await this.repo.buscarPerfilPorId(usuario.perfilId);
    const exigeMfa = Boolean(perfil?.privilegiado || usuario.mfaHabilitado);

    const novaSessao: SessaoUsuario = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      token: crypto.randomBytes(32).toString('hex'),
      ativa: true,
      requerMfa: exigeMfa,
      mfaVerificado: !exigeMfa, // Se exige MFA, inicia como false até validar o segundo fator
      criadoEm: agora,
      encerradoEm: null,
    };

    const sessaoSalva = await this.repo.salvarSessao(novaSessao);

    return {
      sessaoId: sessaoSalva.id,
      token: sessaoSalva.token,
      requerMfa: sessaoSalva.requerMfa,
      mfaVerificado: sessaoSalva.mfaVerificado,
      usuarioId: usuario.id,
    };
  }

  /**
   * Valida o segundo fator de autenticação (MFA) para liberar a sessão ativa de perfis privilegiados (CA-2)
   */
  public async verificarMfa(
    tokenSessao: string,
    codigoMfa: string
  ): Promise<SessaoUsuario> {
    const sessao = await this.repo.buscarSessaoPorToken(tokenSessao);
    if (!sessao || !sessao.ativa) {
      throw new Error('Sessão inválida ou encerrada.');
    }

    const usuario = await this.repo.buscarUsuarioPorId(sessao.usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new Error('Usuário inválido.');
    }

    const agora = new Date();
    if (usuario.bloqueadoAte && usuario.bloqueadoAte > agora) {
      throw new Error(
        'Conta temporariamente bloqueada devido ao excesso de tentativas com falha.'
      );
    }

    if (!usuario.mfaSegredo) {
      throw new Error('Configuração de MFA ausente para este usuário.');
    }

    if (!sessao.requerMfa || !this.validarCodigoMfa(usuario.mfaSegredo, codigoMfa || '', agora.getTime())) {
      usuario.tentativasFalhas += 1;
      if (usuario.tentativasFalhas >= this.maxTentativasLogin) {
        usuario.bloqueadoAte = new Date(agora.getTime() + this.tempoBloqueioMs);
        sessao.ativa = false;
        sessao.encerradoEm = agora;
        await this.repo.salvarSessao(sessao);
      }
      await this.repo.salvarUsuario(usuario);
      throw new Error('Código MFA inválido.');
    }

    // Código MFA válido: zera falhas e libera a sessão ativa (CA-2)
    usuario.tentativasFalhas = 0;
    usuario.bloqueadoAte = null;
    await this.repo.salvarUsuario(usuario);

    sessao.mfaVerificado = true;
    return this.repo.salvarSessao(sessao);
  }

  // ============================================================================
  // Gestão, Validação e Encerramento de Sessões Ativas (CA-4 e RF-075)
  // ============================================================================

  /**
   * Valida se o token corresponde a uma sessão ativa e com MFA concluído (quando exigido)
   */
  public async validarSessaoAtiva(token: string): Promise<{
    sessao: SessaoUsuario;
    usuario: UsuarioSistema;
    perfil: PerfilAcesso;
  }> {
    if (!token) {
      throw new Error('Token de sessão não fornecido.');
    }

    const sessao = await this.repo.buscarSessaoPorToken(token);
    if (!sessao || !sessao.ativa) {
      throw new Error('Sessão inativa ou encerrada.');
    }

    // Impede que perfis privilegiados acessem recursos antes de concluir o MFA (CA-2)
    const usuario = await this.repo.buscarUsuarioPorId(sessao.usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new Error('Usuário inativo ou inexistente.');
    }

    const perfil = await this.repo.buscarPerfilPorId(usuario.perfilId);
    if (!perfil) {
      throw new Error('Perfil de usuário não encontrado.');
    }

    if ((sessao.requerMfa || perfil.privilegiado) && !sessao.mfaVerificado) {
      throw new Error(
        'Autenticação multifator (MFA) pendente. Conclua a verificação MFA para acessar.'
      );
    }

    return { sessao, usuario, perfil };
  }

  /**
   * Lista as sessões ativas de um usuário (próprio usuário ou administrador com 'sessoes:administrar')
   */
  public async listarSessoesAtivas(
    usuarioAlvoId: string,
    solicitanteUsuarioId: string
  ): Promise<SessaoUsuario[]> {
    if (usuarioAlvoId !== solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'sessoes:administrar');
    }

    const sessoes = await this.repo.listarSessoesPorUsuario(usuarioAlvoId);
    return sessoes.filter((s) => s.ativa);
  }

  public async encerrarSessoesDoUsuario(
    usuarioAlvoId: string,
    solicitanteUsuarioId: string
  ): Promise<SessaoUsuario[]> {
    if (usuarioAlvoId !== solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'sessoes:administrar');
    }

    const sessoes = await this.repo.listarSessoesPorUsuario(usuarioAlvoId);
    const ativas = sessoes.filter((sessao) => sessao.ativa);
    const encerradas = await Promise.all(
      ativas.map((sessao) => {
        sessao.ativa = false;
        sessao.encerradoEm = new Date();
        return this.repo.salvarSessao(sessao);
      }),
    );

    return encerradas;
  }

  /**
   * Encerra imediatamente uma sessão ativa por ID ou Token (CA-4).
   * Permite que o próprio dono da sessão encerre sua sessão ou que um administrador com
   * permissão 'sessoes:administrar' encerre a sessão de qualquer usuário.
   */
  public async encerrarSessao(
    sessaoIdOuToken: string,
    solicitanteUsuarioId: string
  ): Promise<SessaoUsuario> {
    let sessao = await this.repo.buscarSessaoPorId(sessaoIdOuToken);
    if (!sessao) {
      sessao = await this.repo.buscarSessaoPorToken(sessaoIdOuToken);
    }

    if (!sessao) {
      throw new Error('Sessão não encontrada.');
    }

    // Se o solicitante não for o dono da sessão, exige permissão administrativa (CA-5)
    if (sessao.usuarioId !== solicitanteUsuarioId) {
      await this.exigirPermissao(solicitanteUsuarioId, 'sessoes:administrar');
    }

    sessao.ativa = false;
    sessao.encerradoEm = new Date();
    return this.repo.salvarSessao(sessao);
  }
}
