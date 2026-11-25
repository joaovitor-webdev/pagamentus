import express, { Express } from 'express';
import { InMemoryPlanoContasRepository } from './repositories/PlanoContasRepository';
import { PlanoContasService } from './services/PlanoContasService';
import { PlanoContasController } from './controllers/PlanoContasController';
import { criarPlanoContasRouter } from './routes/planoContasRoutes';

import { InMemoryLancamentoContabilRepository } from './repositories/LancamentoContabilRepository';
import { InMemoryPeriodoContabilRepository } from './repositories/PeriodoContabilRepository';
import { LancamentoContabilService } from './services/LancamentoContabilService';
import { LancamentoContabilController } from './controllers/LancamentoContabilController';
import { criarLancamentoContabilRouter } from './routes/lancamentoContabilRoutes';

import { InMemoryModeloLancamentoRepository } from './repositories/ModeloLancamentoRepository';
import { ModeloLancamentoService } from './services/ModeloLancamentoService';
import { ModeloLancamentoController } from './controllers/ModeloLancamentoController';
import { criarModeloLancamentoRouter } from './routes/modeloLancamentoRoutes';

import { InMemoryLoteImportacaoRepository } from './repositories/LoteImportacaoRepository';
import { ImportacaoLancamentosService } from './services/ImportacaoLancamentosService';
import { ImportacaoLancamentosController } from './controllers/ImportacaoLancamentosController';
import { criarImportacaoLancamentosRouter } from './routes/importacaoLancamentosRoutes';

import { InMemoryAutenticacaoRepository } from './repositories/AutenticacaoRepository';
import { AutenticacaoService } from './services/AutenticacaoService';
import { AutenticacaoController } from './controllers/AutenticacaoController';
import { criarAutenticacaoRouter } from './routes/autenticacaoRoutes';

import { InMemoryIsolamentoClienteRepository } from './repositories/IsolamentoClienteRepository';
import { CriptografiaSegurancaService } from './services/CriptografiaSegurancaService';
import { IsolamentoClienteService } from './services/IsolamentoClienteService';
import { IsolamentoClienteController } from './controllers/IsolamentoClienteController';
import { criarIsolamentoClienteRouter } from './routes/isolamentoClienteRoutes';

import { InMemoryPessoaEmpresaRepository } from './repositories/PessoaEmpresaRepository';
import { PessoaEmpresaService } from './services/PessoaEmpresaService';
import { PessoaEmpresaController } from './controllers/PessoaEmpresaController';
import { criarPessoaEmpresaRouter } from './routes/pessoaEmpresaRoutes';

import { InMemoryEstabelecimentoSocioResponsavelRepository } from './repositories/EstabelecimentoSocioResponsavelRepository';
import { EstabelecimentoSocioResponsavelService } from './services/EstabelecimentoSocioResponsavelService';
import { EstabelecimentoSocioResponsavelController } from './controllers/EstabelecimentoSocioResponsavelController';
import { criarEstabelecimentoSocioResponsavelRouter } from './routes/estabelecimentoSocioResponsavelRoutes';

import { InMemoryAnexoCadastralRepository } from './repositories/AnexoCadastralRepository';
import { AnexoCadastralService } from './services/AnexoCadastralService';
import { AnexoCadastralController } from './controllers/AnexoCadastralController';
import { criarAnexoCadastralRouter } from './routes/anexoCadastralRoutes';

import { InMemoryAuditoriaHistoricoRepository } from './repositories/AuditoriaHistoricoRepository';
import { AuditoriaHistoricoService } from './services/AuditoriaHistoricoService';
import { AuditoriaHistoricoController } from './controllers/AuditoriaHistoricoController';
import { criarAuditoriaHistoricoRouter } from './routes/auditoriaHistoricoRoutes';

import { InMemoryCredencialTokenIntegracaoRepository } from './repositories/CredencialTokenIntegracaoRepository';
import { CredencialTokenIntegracaoService } from './services/CredencialTokenIntegracaoService';
import { CredencialTokenIntegracaoController } from './controllers/CredencialTokenIntegracaoController';
import { criarCredencialTokenIntegracaoRouter } from './routes/credencialTokenIntegracaoRoutes';

import { InMemoryLgpdPrivacidadeRepository } from './repositories/LgpdPrivacidadeRepository';
import { LgpdPrivacidadeService } from './services/LgpdPrivacidadeService';
import { LgpdPrivacidadeController } from './controllers/LgpdPrivacidadeController';
import { criarLgpdPrivacidadeRouter } from './routes/lgpdPrivacidadeRoutes';

import { InMemoryBackupRecuperacaoRepository } from './repositories/BackupRecuperacaoRepository';
import { BackupRecuperacaoService } from './services/BackupRecuperacaoService';
import { BackupRecuperacaoController } from './controllers/BackupRecuperacaoController';
import { criarBackupRecuperacaoRouter } from './routes/backupRecuperacaoRoutes';

import { PeriodoContabilService } from './services/PeriodoContabilService';
import { PeriodoContabilController } from './controllers/PeriodoContabilController';
import { criarPeriodoContabilRouter } from './routes/periodoContabilRoutes';

import { InMemoryCentroCustoRepository } from './repositories/CentroCustoRepository';
import { CentroCustoComparativoService } from './services/CentroCustoComparativoService';
import { CentroCustoComparativoController } from './controllers/CentroCustoComparativoController';
import { criarCentroCustoComparativoRouter } from './routes/centroCustoComparativoRoutes';
import { RelatorioContabilService } from './services/RelatorioContabilService';
import { RelatorioContabilController } from './controllers/RelatorioContabilController';
import { criarRelatorioContabilRouter } from './routes/relatorioContabilRoutes';
import { DemonstracaoContabilService } from './services/DemonstracaoContabilService';
import { DemonstracaoContabilController } from './controllers/DemonstracaoContabilController';
import { criarDemonstracaoContabilRouter } from './routes/demonstracaoContabilRoutes';
import { InMemoryTituloFinanceiroRepository } from './repositories/TituloFinanceiroRepository';
import { TituloFinanceiroService } from './services/TituloFinanceiroService';
import { TituloFinanceiroController } from './controllers/TituloFinanceiroController';
import { criarTituloFinanceiroRouter } from './routes/tituloFinanceiroRoutes';
import { InMemoryBaixaTituloRepository } from './repositories/BaixaTituloRepository';
import { BaixaTituloService } from './services/BaixaTituloService';
import { BaixaTituloController } from './controllers/BaixaTituloController';
import { criarBaixaTituloRouter } from './routes/baixaTituloRoutes';
import { InMemoryConciliacaoRepository } from './repositories/ConciliacaoRepository';
import { ConciliacaoService } from './services/ConciliacaoService';
import { ConciliacaoController } from './controllers/ConciliacaoController';
import { criarConciliacaoRouter } from './routes/conciliacaoRoutes';
import { RelatorioFinanceiroService } from './services/RelatorioFinanceiroService';
import { RelatorioFinanceiroController } from './controllers/RelatorioFinanceiroController';
import { criarRelatorioFinanceiroRouter } from './routes/relatorioFinanceiroRoutes';
import { InMemoryPatrimonioEstoqueRepository } from './repositories/PatrimonioEstoqueRepository';
import { PatrimonioEstoqueService } from './services/PatrimonioEstoqueService';
import { PatrimonioEstoqueController } from './controllers/PatrimonioEstoqueController';
import { criarPatrimonioEstoqueRouter } from './routes/patrimonioEstoqueRoutes';
import { InMemoryDocumentoFiscalImportadoRepository } from './repositories/DocumentoFiscalImportadoRepository';
import { DocumentoFiscalImportadoService } from './services/DocumentoFiscalImportadoService';
import { DocumentoFiscalImportadoController } from './controllers/DocumentoFiscalImportadoController';
import { criarDocumentoFiscalImportadoRouter } from './routes/documentoFiscalImportadoRoutes';
import { InMemoryNotaFiscalRepository } from './repositories/NotaFiscalRepository';
import { NotaFiscalService } from './services/NotaFiscalService';
import { NotaFiscalController } from './controllers/NotaFiscalController';
import { criarNotaFiscalRouter } from './routes/notaFiscalRoutes';
import { InMemoryValidacaoFiscalRepository } from './repositories/ValidacaoFiscalRepository';
import { ValidacaoFiscalService } from './services/ValidacaoFiscalService';
import { ValidacaoFiscalController } from './controllers/ValidacaoFiscalController';
import { criarValidacaoFiscalRouter } from './routes/validacaoFiscalRoutes';
import { InMemoryClassificacaoOperacaoRepository } from './repositories/ClassificacaoOperacaoRepository';
import { ClassificacaoOperacaoService } from './services/ClassificacaoOperacaoService';
import { ClassificacaoOperacaoController } from './controllers/ClassificacaoOperacaoController';
import { criarClassificacaoOperacaoRouter } from './routes/classificacaoOperacaoRoutes';
import { InMemoryRegraTributariaVersionadaRepository } from './repositories/RegraTributariaVersionadaRepository';
import { RegraTributariaVersionadaService } from './services/RegraTributariaVersionadaService';
import { RegraTributariaVersionadaController } from './controllers/RegraTributariaVersionadaController';
import { criarRegraTributariaVersionadaRouter } from './routes/regraTributariaVersionadaRoutes';
import { InMemoryRegimeTributarioEmpresaRepository } from './repositories/RegimeTributarioEmpresaRepository';
import { RegimeTributarioEmpresaService } from './services/RegimeTributarioEmpresaService';
import { RegimeTributarioEmpresaController } from './controllers/RegimeTributarioEmpresaController';
import { criarRegimeTributarioEmpresaRouter } from './routes/regimeTributarioEmpresaRoutes';
import { InMemoryCalculoTributarioRepository } from './repositories/CalculoTributarioRepository';
import { CalculoTributarioService } from './services/CalculoTributarioService';
import { CalculoTributarioController } from './controllers/CalculoTributarioController';
import { criarCalculoTributarioRouter } from './routes/calculoTributarioRoutes';
import { InMemoryRetencaoCreditoParcelamentoRepository } from './repositories/RetencaoCreditoParcelamentoRepository';
import { RetencaoCreditoParcelamentoService } from './services/RetencaoCreditoParcelamentoService';
import { RetencaoCreditoParcelamentoController } from './controllers/RetencaoCreditoParcelamentoController';
import { criarRetencaoCreditoParcelamentoRouter } from './routes/retencaoCreditoParcelamentoRoutes';
import { GuiaDemonstrativoFiscalService } from './services/GuiaDemonstrativoFiscalService';
import { GuiaDemonstrativoFiscalController } from './controllers/GuiaDemonstrativoFiscalController';
import { criarGuiaDemonstrativoFiscalRouter } from './routes/guiaDemonstrativoFiscalRoutes';
import { DivergenciaFiscalContabilService } from './services/DivergenciaFiscalContabilService';
import { DivergenciaFiscalContabilController } from './controllers/DivergenciaFiscalContabilController';
import { criarDivergenciaFiscalContabilRouter } from './routes/divergenciaFiscalContabilRoutes';
import { SimulacaoCenarioTributarioService } from './services/SimulacaoCenarioTributarioService';
import { SimulacaoCenarioTributarioController } from './controllers/SimulacaoCenarioTributarioController';
import { criarSimulacaoCenarioTributarioRouter } from './routes/simulacaoCenarioTributarioRoutes';
import { RevisaoAprovacaoFiscalService } from './services/RevisaoAprovacaoFiscalService';
import { RevisaoAprovacaoFiscalController } from './controllers/RevisaoAprovacaoFiscalController';
import { criarRevisaoAprovacaoFiscalRouter } from './routes/revisaoAprovacaoFiscalRoutes';
import { FichaContribuinteIrService } from './services/FichaContribuinteIrService';
import { FichaContribuinteIrController } from './controllers/FichaContribuinteIrController';
import { criarFichaContribuinteIrRouter } from './routes/fichaContribuinteIrRoutes';
import { RendimentoDeducaoIrService } from './services/RendimentoDeducaoIrService';
import { RendimentoDeducaoIrController } from './controllers/RendimentoDeducaoIrController';
import { criarRendimentoDeducaoIrRouter } from './routes/rendimentoDeducaoIrRoutes';
import { PatrimonioIrService } from './services/PatrimonioIrService';
import { PatrimonioIrController } from './controllers/PatrimonioIrController';
import { criarPatrimonioIrRouter } from './routes/patrimonioIrRoutes';
import { InformeOrigemIrService } from './services/InformeOrigemIrService';
import { InformeOrigemIrController } from './controllers/InformeOrigemIrController';
import { criarInformeOrigemIrRouter } from './routes/informeOrigemIrRoutes';
import { ConsistenciaIrService } from './services/ConsistenciaIrService';
import { ConsistenciaIrController } from './controllers/ConsistenciaIrController';
import { criarConsistenciaIrRouter } from './routes/consistenciaIrRoutes';
import { ComparacaoTributacaoIrService } from './services/ComparacaoTributacaoIrService';
import { ComparacaoTributacaoIrController } from './controllers/ComparacaoTributacaoIrController';
import { criarComparacaoTributacaoIrRouter } from './routes/comparacaoTributacaoIrRoutes';
import { PendenciaStatusIrService } from './services/PendenciaStatusIrService';
import { PendenciaStatusIrController } from './controllers/PendenciaStatusIrController';
import { criarPendenciaStatusIrRouter } from './routes/pendenciaStatusIrRoutes';

/**
 * Factory para criar a aplicação Express configurada com os módulos contábeis e de plataforma
 */
export function criarApp(): {
  app: Express;
  planoContasRepo: InMemoryPlanoContasRepository;
  planoContasService: PlanoContasService;
  lancamentoRepo: InMemoryLancamentoContabilRepository;
  periodoRepo: InMemoryPeriodoContabilRepository;
  lancamentoService: LancamentoContabilService;
  modeloRepo: InMemoryModeloLancamentoRepository;
  modeloService: ModeloLancamentoService;
  loteRepo: InMemoryLoteImportacaoRepository;
  importacaoService: ImportacaoLancamentosService;
  authRepo: InMemoryAutenticacaoRepository;
  authService: AutenticacaoService;
  isolamentoRepo: InMemoryIsolamentoClienteRepository;
  criptoService: CriptografiaSegurancaService;
  isolamentoService: IsolamentoClienteService;
  pessoaEmpresaRepo: InMemoryPessoaEmpresaRepository;
  pessoaEmpresaService: PessoaEmpresaService;
  estabelecimentoSocioRepo: InMemoryEstabelecimentoSocioResponsavelRepository;
  estabelecimentoSocioService: EstabelecimentoSocioResponsavelService;
  anexoCadastralRepo: InMemoryAnexoCadastralRepository;
  anexoCadastralService: AnexoCadastralService;
  auditoriaRepo: InMemoryAuditoriaHistoricoRepository;
  auditoriaService: AuditoriaHistoricoService;
  credencialTokenRepo: InMemoryCredencialTokenIntegracaoRepository;
  credencialTokenService: CredencialTokenIntegracaoService;
  lgpdRepo: InMemoryLgpdPrivacidadeRepository;
  lgpdService: LgpdPrivacidadeService;
  backupRepo: InMemoryBackupRecuperacaoRepository;
  backupService: BackupRecuperacaoService;
  periodoContabilService: PeriodoContabilService;
  centroCustoRepo: InMemoryCentroCustoRepository;
  centroCustoService: CentroCustoComparativoService;
  relatorioContabilService: RelatorioContabilService;
  demonstracaoContabilService: DemonstracaoContabilService;
  tituloFinanceiroRepo: InMemoryTituloFinanceiroRepository;
  tituloFinanceiroService: TituloFinanceiroService;
  baixaTituloRepo: InMemoryBaixaTituloRepository;
  baixaTituloService: BaixaTituloService;
  conciliacaoRepo: InMemoryConciliacaoRepository;
  conciliacaoService: ConciliacaoService;
  relatorioFinanceiroService: RelatorioFinanceiroService;
  patrimonioEstoqueRepo: InMemoryPatrimonioEstoqueRepository;
  patrimonioEstoqueService: PatrimonioEstoqueService;
  documentoFiscalImportadoRepo: InMemoryDocumentoFiscalImportadoRepository;
  documentoFiscalImportadoService: DocumentoFiscalImportadoService;
  notaFiscalRepo: InMemoryNotaFiscalRepository;
  notaFiscalService: NotaFiscalService;
  validacaoFiscalRepo: InMemoryValidacaoFiscalRepository;
  validacaoFiscalService: ValidacaoFiscalService;
  classificacaoOperacaoRepo: InMemoryClassificacaoOperacaoRepository;
  classificacaoOperacaoService: ClassificacaoOperacaoService;
  regraTributariaVersionadaRepo: InMemoryRegraTributariaVersionadaRepository;
  regraTributariaVersionadaService: RegraTributariaVersionadaService;
  regimeTributarioEmpresaRepo: InMemoryRegimeTributarioEmpresaRepository;
  regimeTributarioEmpresaService: RegimeTributarioEmpresaService;
  calculoTributarioRepo: InMemoryCalculoTributarioRepository;
  calculoTributarioService: CalculoTributarioService;
  retencaoCreditoParcelamentoRepo: InMemoryRetencaoCreditoParcelamentoRepository;
  retencaoCreditoParcelamentoService: RetencaoCreditoParcelamentoService;
  guiaDemonstrativoFiscalService: GuiaDemonstrativoFiscalService;
  divergenciaFiscalContabilService: DivergenciaFiscalContabilService;
  simulacaoCenarioTributarioService: SimulacaoCenarioTributarioService;
  revisaoAprovacaoFiscalService: RevisaoAprovacaoFiscalService;
  fichaContribuinteIrService: FichaContribuinteIrService;
  rendimentoDeducaoIrService: RendimentoDeducaoIrService;
  patrimonioIrService: PatrimonioIrService;
  informeOrigemIrService: InformeOrigemIrService;
  consistenciaIrService: ConsistenciaIrService;
  comparacaoTributacaoIrService: ComparacaoTributacaoIrService;
  pendenciaStatusIrService: PendenciaStatusIrService;
} {
  const app = express();

  // Middleware para parser de JSON
  app.use(express.json());

  // 1. Módulo Plano de Contas (SPEC-2.1)
  const planoContasRepo = new InMemoryPlanoContasRepository();
  const planoContasService = new PlanoContasService(planoContasRepo);
  const planoContasController = new PlanoContasController(planoContasService);

  // 2. Módulo Lançamentos Contábeis (SPEC-2.2 / SPEC-2.3 / SPEC-2.6)
  const lancamentoRepo = new InMemoryLancamentoContabilRepository();
  const periodoRepo = new InMemoryPeriodoContabilRepository();
  const centroCustoRepo = new InMemoryCentroCustoRepository();
  const lancamentoService = new LancamentoContabilService(
    lancamentoRepo,
    periodoRepo,
    planoContasService,
    centroCustoRepo
  );
  const lancamentoController = new LancamentoContabilController(lancamentoService);

  // 3. Módulo Modelos de Lançamento e Recorrentes (SPEC-2.3)
  const modeloRepo = new InMemoryModeloLancamentoRepository();
  const modeloService = new ModeloLancamentoService(modeloRepo, lancamentoService, planoContasService);
  const modeloController = new ModeloLancamentoController(modeloService);

  // 4. Módulo Importação de Lançamentos em Lote (SPEC-2.4)
  const loteRepo = new InMemoryLoteImportacaoRepository();
  const importacaoService = new ImportacaoLancamentosService(
    loteRepo,
    lancamentoRepo,
    lancamentoService,
    planoContasService,
    periodoRepo
  );
  const importacaoController = new ImportacaoLancamentosController(importacaoService);

  // 5. Módulo Autenticação, Senhas, MFA, Perfis, Permissões e Sessões (SPEC-1.4)
  const authRepo = new InMemoryAutenticacaoRepository();
  const authService = new AutenticacaoService(authRepo);
  const authController = new AutenticacaoController(authService);

  // 6. Módulo Isolamento entre Clientes, Menor Privilégio e Criptografia/TLS (SPEC-1.5)
  const isolamentoRepo = new InMemoryIsolamentoClienteRepository();
  const criptoService = new CriptografiaSegurancaService();
  const isolamentoService = new IsolamentoClienteService(
    isolamentoRepo,
    authRepo,
    authService,
    criptoService
  );
  const isolamentoController = new IsolamentoClienteController(isolamentoService, criptoService);

  // 7. Módulo Cadastro de Pessoas (PF), Empresas (PJ) e Dados Fiscais com Vigência (SPEC-1.6)
  const pessoaEmpresaRepo = new InMemoryPessoaEmpresaRepository();
  const pessoaEmpresaService = new PessoaEmpresaService(pessoaEmpresaRepo);
  const pessoaEmpresaController = new PessoaEmpresaController(pessoaEmpresaService);

  // 8. Módulo Estabelecimentos (Matriz e Filiais), Sócios e Responsáveis Técnicos (SPEC-1.7)
  const estabelecimentoSocioRepo = new InMemoryEstabelecimentoSocioResponsavelRepository();
  const estabelecimentoSocioService = new EstabelecimentoSocioResponsavelService(
    estabelecimentoSocioRepo
  );
  const estabelecimentoSocioController = new EstabelecimentoSocioResponsavelController(
    estabelecimentoSocioService
  );

  // 9. Módulo Anexos Cadastrais com Controle de Validade e Alertas (SPEC-1.8)
  const anexoCadastralRepo = new InMemoryAnexoCadastralRepository();
  const anexoCadastralService = new AnexoCadastralService(anexoCadastralRepo);
  const anexoCadastralController = new AnexoCadastralController(anexoCadastralService);

  // 10. Módulo Auditoria e Histórico Cadastral Imutável (SPEC-1.9)
  const auditoriaRepo = new InMemoryAuditoriaHistoricoRepository();
  const auditoriaService = new AuditoriaHistoricoService(auditoriaRepo);
  const auditoriaController = new AuditoriaHistoricoController(auditoriaService);

  // 11. Módulo Credenciais Protegidas e Tokens de Integração com Escopo Mínimo (SPEC-1.10)
  const credencialTokenRepo = new InMemoryCredencialTokenIntegracaoRepository();
  const credencialTokenService = new CredencialTokenIntegracaoService(
    credencialTokenRepo,
    criptoService
  );
  const credencialTokenController = new CredencialTokenIntegracaoController(
    credencialTokenService
  );

  // 12. Módulo Privacidade e LGPD (SPEC-1.11)
  const lgpdRepo = new InMemoryLgpdPrivacidadeRepository();
  const lgpdService = new LgpdPrivacidadeService(lgpdRepo);
  const lgpdController = new LgpdPrivacidadeController(lgpdService);

  // 13. Módulo Backup Criptografado, Restauração e Continuidade (SPEC-1.12)
  const backupRepo = new InMemoryBackupRecuperacaoRepository();
  const backupService = new BackupRecuperacaoService(backupRepo, criptoService);
  const backupController = new BackupRecuperacaoController(backupService);

  // 14. Módulo Períodos Contábeis (SPEC-2.5)
  const periodoContabilService = new PeriodoContabilService(
    periodoRepo,
    authService,
    auditoriaService
  );
  const periodoContabilController = new PeriodoContabilController(periodoContabilService);

  // 15. Módulo Centros de Custo, Dimensões Gerenciais e Comparativos (SPEC-2.6)
  const centroCustoService = new CentroCustoComparativoService(
    centroCustoRepo,
    lancamentoRepo
  );
  const centroCustoController = new CentroCustoComparativoController(centroCustoService);

  // 16. Módulo Balancete, Razão, Diário e Relatório Auxiliar (SPEC-2.7)
  const relatorioContabilService = new RelatorioContabilService(
    lancamentoRepo,
    planoContasRepo
  );
  const relatorioContabilController = new RelatorioContabilController(
    relatorioContabilService
  );

  // 17. Módulo Balanço, DRE, DFC e DMPL/DLPA (SPEC-2.8)
  const demonstracaoContabilService = new DemonstracaoContabilService(
    lancamentoRepo,
    planoContasRepo
  );
  const demonstracaoContabilController = new DemonstracaoContabilController(
    demonstracaoContabilService
  );

  // 18. Módulo Títulos a Pagar e a Receber e Vínculos (SPEC-2.9)
  const tituloFinanceiroRepo = new InMemoryTituloFinanceiroRepository();
  const tituloFinanceiroService = new TituloFinanceiroService(
    tituloFinanceiroRepo,
    lancamentoRepo
  );
  const tituloFinanceiroController = new TituloFinanceiroController(
    tituloFinanceiroService
  );

  // 19. Módulo Baixas, Juros, Multas, Descontos, Estornos e Inadimplência (SPEC-2.10)
  const baixaTituloRepo = new InMemoryBaixaTituloRepository();
  const baixaTituloService = new BaixaTituloService(
    baixaTituloRepo,
    tituloFinanceiroRepo
  );
  const baixaTituloController = new BaixaTituloController(baixaTituloService);

  // 20. Módulo Conciliação Contábil e Bancária (SPEC-2.11)
  const conciliacaoRepo = new InMemoryConciliacaoRepository();
  const conciliacaoService = new ConciliacaoService(
    conciliacaoRepo,
    lancamentoRepo,
    planoContasRepo,
    tituloFinanceiroRepo,
    baixaTituloRepo
  );
  const conciliacaoController = new ConciliacaoController(conciliacaoService);

  // 21. Módulo Fluxo de Caixa e Relatórios Financeiros (SPEC-2.12)
  const relatorioFinanceiroService = new RelatorioFinanceiroService(
    tituloFinanceiroRepo,
    baixaTituloRepo,
    centroCustoRepo
  );
  const relatorioFinanceiroController = new RelatorioFinanceiroController(
    relatorioFinanceiroService
  );

  // 22. Módulo Patrimônio e Estoque (SPEC-2.13)
  const patrimonioEstoqueRepo = new InMemoryPatrimonioEstoqueRepository();
  const patrimonioEstoqueService = new PatrimonioEstoqueService(
    patrimonioEstoqueRepo
  );
  const patrimonioEstoqueController = new PatrimonioEstoqueController(
    patrimonioEstoqueService
  );

  // 23. Módulo Importação de Documentos Fiscais (SPEC-3.1)
  const documentoFiscalImportadoRepo =
    new InMemoryDocumentoFiscalImportadoRepository();
  const documentoFiscalImportadoService =
    new DocumentoFiscalImportadoService(documentoFiscalImportadoRepo);
  const documentoFiscalImportadoController =
    new DocumentoFiscalImportadoController(documentoFiscalImportadoService);

  // 24. Módulo Notas de Entrada e Saída (SPEC-3.2)
  const notaFiscalRepo = new InMemoryNotaFiscalRepository();
  const notaFiscalService = new NotaFiscalService(notaFiscalRepo);
  const notaFiscalController = new NotaFiscalController(notaFiscalService);

  // 25. Módulo Validação Fiscal e Duplicidades (SPEC-3.3)
  const validacaoFiscalRepo = new InMemoryValidacaoFiscalRepository();
  const validacaoFiscalService = new ValidacaoFiscalService(
    validacaoFiscalRepo,
    notaFiscalRepo,
    documentoFiscalImportadoRepo
  );
  const validacaoFiscalController = new ValidacaoFiscalController(
    validacaoFiscalService
  );

  // 26. Módulo Classificação das Operações (SPEC-3.4)
  const classificacaoOperacaoRepo =
    new InMemoryClassificacaoOperacaoRepository();
  const classificacaoOperacaoService = new ClassificacaoOperacaoService(
    classificacaoOperacaoRepo
  );
  const classificacaoOperacaoController =
    new ClassificacaoOperacaoController(classificacaoOperacaoService);

  // 27. Módulo Regras Tributárias Versionadas (SPEC-3.5)
  const regraTributariaVersionadaRepo =
    new InMemoryRegraTributariaVersionadaRepository();
  const regraTributariaVersionadaService =
    new RegraTributariaVersionadaService(regraTributariaVersionadaRepo);
  const regraTributariaVersionadaController =
    new RegraTributariaVersionadaController(regraTributariaVersionadaService);

  // 28. Módulo Regimes Tributários (SPEC-3.6)
  const regimeTributarioEmpresaRepo =
    new InMemoryRegimeTributarioEmpresaRepository();
  const regimeTributarioEmpresaService = new RegimeTributarioEmpresaService(
    regimeTributarioEmpresaRepo
  );
  const regimeTributarioEmpresaController =
    new RegimeTributarioEmpresaController(regimeTributarioEmpresaService);

  // 29. Módulo Cálculo e Memória de Cálculo (SPEC-3.7)
  const calculoTributarioRepo = new InMemoryCalculoTributarioRepository();
  const calculoTributarioService = new CalculoTributarioService(
    calculoTributarioRepo
  );
  const calculoTributarioController = new CalculoTributarioController(
    calculoTributarioService
  );

  // 30. Módulo Retenções, Créditos e Parcelamentos (SPEC-3.8)
  const retencaoCreditoParcelamentoRepo =
    new InMemoryRetencaoCreditoParcelamentoRepository();
  const retencaoCreditoParcelamentoService =
    new RetencaoCreditoParcelamentoService(retencaoCreditoParcelamentoRepo);
  const retencaoCreditoParcelamentoController =
    new RetencaoCreditoParcelamentoController(
      retencaoCreditoParcelamentoService
    );

  // 31. Módulo Guias e Demonstrativos para Conferência (SPEC-3.9)
  const guiaDemonstrativoFiscalService = new GuiaDemonstrativoFiscalService();
  const guiaDemonstrativoFiscalController =
    new GuiaDemonstrativoFiscalController(guiaDemonstrativoFiscalService);

  // 32. Módulo Divergências Fiscais e Contábeis (SPEC-3.10)
  const divergenciaFiscalContabilService =
    new DivergenciaFiscalContabilService();
  const divergenciaFiscalContabilController =
    new DivergenciaFiscalContabilController(divergenciaFiscalContabilService);

  // 33. Módulo Simulação de Cenários Tributários (SPEC-3.11)
  const simulacaoCenarioTributarioService =
    new SimulacaoCenarioTributarioService();
  const simulacaoCenarioTributarioController =
    new SimulacaoCenarioTributarioController(simulacaoCenarioTributarioService);

  // 34. Módulo Revisão e Aprovação Profissional (SPEC-3.12)
  const revisaoAprovacaoFiscalService = new RevisaoAprovacaoFiscalService();
  const revisaoAprovacaoFiscalController = new RevisaoAprovacaoFiscalController(
    revisaoAprovacaoFiscalService
  );

  // 35. Módulo Ficha do Contribuinte e Dependentes (SPEC-3.13)
  const fichaContribuinteIrService = new FichaContribuinteIrService();
  const fichaContribuinteIrController = new FichaContribuinteIrController(
    fichaContribuinteIrService
  );

  // 36. Módulo Rendimentos e Deduções IRPF (SPEC-3.14)
  const rendimentoDeducaoIrService = new RendimentoDeducaoIrService();
  const rendimentoDeducaoIrController = new RendimentoDeducaoIrController(
    rendimentoDeducaoIrService
  );

  // 37. Módulo Bens, Direitos e Dívidas IRPF (SPEC-3.15)
  const patrimonioIrService = new PatrimonioIrService();
  const patrimonioIrController = new PatrimonioIrController(
    patrimonioIrService
  );

  // 38. Módulo Importação de Informes e Origem dos Dados IRPF (SPEC-3.16)
  const informeOrigemIrService = new InformeOrigemIrService();
  const informeOrigemIrController = new InformeOrigemIrController(
    informeOrigemIrService
  );

  // 39. Módulo Consistência e Regras do Exercício IRPF (SPEC-3.17)
  const consistenciaIrService = new ConsistenciaIrService();
  const consistenciaIrController = new ConsistenciaIrController(
    consistenciaIrService
  );

  // 40. Módulo Comparação de Opções de Tributação IRPF (SPEC-3.18)
  const comparacaoTributacaoIrService = new ComparacaoTributacaoIrService();
  const comparacaoTributacaoIrController = new ComparacaoTributacaoIrController(
    comparacaoTributacaoIrService
  );

  // 41. Módulo Pendências e Status IRPF (SPEC-3.19)
  const pendenciaStatusIrService = new PendenciaStatusIrService();
  const pendenciaStatusIrController = new PendenciaStatusIrController(
    pendenciaStatusIrService
  );

  // Prefixo de rotas da API
  app.use('/api', criarPlanoContasRouter(planoContasController));
  app.use('/api', criarLancamentoContabilRouter(lancamentoController));
  app.use('/api', criarModeloLancamentoRouter(modeloController));
  app.use('/api', criarImportacaoLancamentosRouter(importacaoController));
  app.use('/api', criarAutenticacaoRouter(authController));
  app.use('/api', criarIsolamentoClienteRouter(isolamentoController, authController));
  app.use('/api', criarPessoaEmpresaRouter(pessoaEmpresaController));
  app.use('/api', criarEstabelecimentoSocioResponsavelRouter(estabelecimentoSocioController));
  app.use('/api', criarAnexoCadastralRouter(anexoCadastralController));
  app.use('/api', criarAuditoriaHistoricoRouter(auditoriaController));
  app.use('/api', criarCredencialTokenIntegracaoRouter(credencialTokenController));
  app.use('/api', criarLgpdPrivacidadeRouter(lgpdController));
  app.use('/api', criarBackupRecuperacaoRouter(backupController));
  app.use('/api', criarPeriodoContabilRouter(periodoContabilController));
  app.use('/api', criarCentroCustoComparativoRouter(centroCustoController));
  app.use('/api', criarRelatorioContabilRouter(relatorioContabilController));
  app.use('/api', criarDemonstracaoContabilRouter(demonstracaoContabilController));
  app.use('/api', criarTituloFinanceiroRouter(tituloFinanceiroController));
  app.use('/api', criarBaixaTituloRouter(baixaTituloController));
  app.use('/api', criarConciliacaoRouter(conciliacaoController));
  app.use('/api', criarRelatorioFinanceiroRouter(relatorioFinanceiroController));
  app.use('/api', criarPatrimonioEstoqueRouter(patrimonioEstoqueController));
  app.use(
    '/api',
    criarDocumentoFiscalImportadoRouter(documentoFiscalImportadoController)
  );
  app.use('/api', criarNotaFiscalRouter(notaFiscalController));
  app.use('/api', criarValidacaoFiscalRouter(validacaoFiscalController));
  app.use(
    '/api',
    criarClassificacaoOperacaoRouter(classificacaoOperacaoController)
  );
  app.use(
    '/api',
    criarRegraTributariaVersionadaRouter(regraTributariaVersionadaController)
  );
  app.use(
    '/api',
    criarRegimeTributarioEmpresaRouter(regimeTributarioEmpresaController)
  );
  app.use('/api', criarCalculoTributarioRouter(calculoTributarioController));
  app.use(
    '/api',
    criarRetencaoCreditoParcelamentoRouter(
      retencaoCreditoParcelamentoController
    )
  );
  app.use(
    '/api',
    criarGuiaDemonstrativoFiscalRouter(guiaDemonstrativoFiscalController)
  );
  app.use(
    '/api',
    criarDivergenciaFiscalContabilRouter(divergenciaFiscalContabilController)
  );
  app.use(
    '/api',
    criarSimulacaoCenarioTributarioRouter(simulacaoCenarioTributarioController)
  );
  app.use(
    '/api',
    criarRevisaoAprovacaoFiscalRouter(revisaoAprovacaoFiscalController)
  );
  app.use(
    '/api',
    criarFichaContribuinteIrRouter(fichaContribuinteIrController)
  );
  app.use(
    '/api',
    criarRendimentoDeducaoIrRouter(rendimentoDeducaoIrController)
  );
  app.use('/api', criarPatrimonioIrRouter(patrimonioIrController));
  app.use('/api', criarInformeOrigemIrRouter(informeOrigemIrController));
  app.use('/api', criarConsistenciaIrRouter(consistenciaIrController));
  app.use(
    '/api',
    criarComparacaoTributacaoIrRouter(comparacaoTributacaoIrController)
  );
  app.use('/api', criarPendenciaStatusIrRouter(pendenciaStatusIrController));

  return {
    app,
    planoContasRepo,
    planoContasService,
    lancamentoRepo,
    periodoRepo,
    lancamentoService,
    modeloRepo,
    modeloService,
    loteRepo,
    importacaoService,
    authRepo,
    authService,
    isolamentoRepo,
    criptoService,
    isolamentoService,
    pessoaEmpresaRepo,
    pessoaEmpresaService,
    estabelecimentoSocioRepo,
    estabelecimentoSocioService,
    anexoCadastralRepo,
    anexoCadastralService,
    auditoriaRepo,
    auditoriaService,
    credencialTokenRepo,
    credencialTokenService,
    lgpdRepo,
    lgpdService,
    backupRepo,
    backupService,
    periodoContabilService,
    centroCustoRepo,
    centroCustoService,
    relatorioContabilService,
    demonstracaoContabilService,
    tituloFinanceiroRepo,
    tituloFinanceiroService,
    baixaTituloRepo,
    baixaTituloService,
    conciliacaoRepo,
    conciliacaoService,
    relatorioFinanceiroService,
    patrimonioEstoqueRepo,
    patrimonioEstoqueService,
    documentoFiscalImportadoRepo,
    documentoFiscalImportadoService,
    notaFiscalRepo,
    notaFiscalService,
    validacaoFiscalRepo,
    validacaoFiscalService,
    classificacaoOperacaoRepo,
    classificacaoOperacaoService,
    regraTributariaVersionadaRepo,
    regraTributariaVersionadaService,
    regimeTributarioEmpresaRepo,
    regimeTributarioEmpresaService,
    calculoTributarioRepo,
    calculoTributarioService,
    retencaoCreditoParcelamentoRepo,
    retencaoCreditoParcelamentoService,
    guiaDemonstrativoFiscalService,
    divergenciaFiscalContabilService,
    simulacaoCenarioTributarioService,
    revisaoAprovacaoFiscalService,
    fichaContribuinteIrService,
    rendimentoDeducaoIrService,
    patrimonioIrService,
    informeOrigemIrService,
    consistenciaIrService,
    comparacaoTributacaoIrService,
    pendenciaStatusIrService,
  };
}

export const { app } = criarApp();
