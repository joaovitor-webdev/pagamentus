# Changelog
Uma linha por spec concluída, no estilo Keep a Changelog.

## [Não lançado]
### Adicionado
- SPEC-5.2: Especificação dos painéis de indicadores.
- SPEC-1.1: Estrutura base de documentação, modelos de especificação e regras de proteção da branch main.
- [SPEC-1.2] Arquitetura, stack e ambientes (PR #54, João Vitor): registra a stack adotada e valida a seleção dos bancos por ambiente.
- [SPEC-1.3] Modelo de dados e integridade (PR #55, João Vitor): reimplementação SDD com validação das constraints do esquema inicial, rejeição de duplicidade e rollback transacional.
- [SPEC-1.4] Autenticação, senhas e MFA (PR #56, João Vitor): TOTP temporal, administração protegida de contas/perfis/permissões, revogação de sessões e respostas sem credenciais ou tokens sensíveis (RF-075, RNF-003).
- [SPEC-1.5] Perfis, permissões e isolamento entre clientes (PR #15, João Vitor): Segregação entre clientes com autorização expressa, menor privilégio, criptografia de dados sensíveis e TLS (RB-008, RNF-001).
- [SPEC-1.6] Cadastro de pessoas e empresas (PR #17, João Vitor): Cadastro de PF/PJ com validação de CPF/CNPJ, inscrições, contatos, endereços, responsáveis e dados fiscais com vigência (RF-001, RF-002).
- [SPEC-1.7] Estabelecimentos, filiais, sócios e responsáveis (PR #18, João Vitor): Múltiplos estabelecimentos, filiais, sócios e responsáveis técnicos vinculados à mesma organização (RF-005).
- [SPEC-1.8] Anexos cadastrais com validade (PR #19, João Vitor): Anexação de contrato social, procurações, certificados e documentos cadastrais com controle e alerta de validade (RF-003).
- [SPEC-1.9] Auditoria e histórico cadastral (PR #20, João Vitor): Trilha de auditoria imutável para inclusão, alteração, exclusão lógica, estorno e aprovação com histórico cadastral rastreável (RF-015, RF-004, RNF-004, RB-007).
- [SPEC-1.10] Credenciais e tokens de integração (PR #21, João Vitor): Armazenamento protegido de credenciais, emissão de tokens com escopo mínimo e rotação/revogação (RF-076).
- [SPEC-1.11] Privacidade e LGPD (PR #22, João Vitor): Política LGPD (finalidade, base legal, minimização, operadores, retenção e descarte), fluxo de pedidos de titulares e registro de incidentes (RNF-002).
- [SPEC-1.12] Backup, recuperação e continuidade (PR #23, João Vitor): Backups automáticos criptografados, testes periódicos de restauração registrados, RPO/RTO e plano de continuidade/incidentes (RNF-008, RNF-016).
- [SPEC-2.1] Plano de contas (PR #6, Ítalo Natam): Estrutura e manutenção de plano de contas contábil configurável por empresa com validação de lançamentos em contas analíticas (RF-006).
- [SPEC-2.2] Lançamentos manuais com partidas dobradas (PR #12, Ítalo Natam): Lançamentos manuais estruturados com partidas dobradas, validação de período aberto, contas ativas e consistência de valores (RF-007, RF-008, RB-001).
- [SPEC-2.3] Recorrentes, rateios, provisões e estornos (PR #12, Ítalo Natam): Modelos de lançamentos recorrentes, rateios proporcionais e estornos com rastreabilidade ao lançamento de origem (RF-009).
- [SPEC-2.4] Importação de lançamentos (PR #12, Ítalo Natam): Importação de lançamentos em lote por planilha com pré-validação, relatório de erros por linha e opção de desfazer lote (RF-010).
- [SPEC-2.5] Períodos contábeis (PR #25, Ítalo Natam): Controle de períodos contábeis abertos, em fechamento e encerrados com bloqueio e reabertura mediante permissão, justificativa e auditoria (RF-012, RB-002).
- [SPEC-2.6] Centros de custo e comparativos (PR #26, Ítalo Natam): Cadastro de centros de custo, departamentos, projetos e unidades, associação a lançamentos e comparativo entre dois períodos (RF-014).
- [SPEC-2.7] Balancete, razão e diário (PR #27, Ítalo Natam): Geração de Balancete de Verificação, Livro Razão, Livro Diário e relatório auxiliar consistentes com os lançamentos (RF-013).
- [SPEC-2.8] Balanço, DRE, DFC e DMPL (PR #28, Ítalo Natam): Geração de Balanço Patrimonial, DRE, DFC e DMPL/DLPA consistentes a partir do mesmo cenário contábil (RF-013).
- [SPEC-2.9] Títulos a pagar e a receber e vínculos (PR #29, Ítalo Natam): Cadastro de títulos, parcelas, vencimentos, fornecedores/clientes, categorias, condições de pagamento e vínculos com documento fiscal, lançamento contábil, comprovante e anexos (RF-046, RF-050).
- [SPEC-2.10] Baixas, juros e inadimplência (PR #30, Ítalo Natam): Controle de pagamentos, recebimentos, baixas parciais/totais com juros, multas e descontos, estornos e marcação de inadimplência (RF-047).
- [SPEC-2.11] Conciliação contábil e bancária (PR #31, Ítalo Natam): Importação de extratos bancários com sugestão de conciliação, confirmação manual e conciliação de saldos contábeis com pagar/receber, folha e módulos fiscais (RF-011, RF-048).
- [SPEC-2.12] Fluxo de caixa e relatórios financeiros (PR #32, Ítalo Natam): Geração de fluxo de caixa, posição financeira, aging de recebíveis, previsão de pagamentos e relatório financeiro por centro de custo (RF-049).
- [SPEC-2.13] Patrimônio e estoque (PR #33, Ítalo Natam): Cadastro de bens, depreciação/amortização/exaustão, transferências, reavaliações, baixas com histórico documental e importação de saldos e movimentações de estoque (RF-057, RF-058, RF-059, RF-060).
- [SPEC-3.1] Importação de documentos fiscais (PR #37, Matheus Sousa): Importação de documentos fiscais e arquivos de sistemas autorizados preservando o conteúdo original e verificando integridade via SHA-256 (RF-016).
- [SPEC-3.2] Notas de entrada e saída (PR #38, Matheus Sousa): Registro de notas de entrada, saída e serviços com retenções, cancelamentos, devoluções e ajustes aplicáveis (RF-017).
- [SPEC-3.3] Validação fiscal e duplicidades (PR #39, Matheus Sousa): Configuração de regras fiscais por empresa e validação de campos, datas, valores, participantes, códigos tributários e duplicidades com retorno detalhado dos motivos (RF-018).
- [SPEC-3.4] Classificação das operações (PR #40, Matheus Sousa): Classificação fiscal por natureza, CFOP, NCM e CST/CSOSN conforme operação e regime utilizando tabelas fictícias configuráveis (RF-019).
- [SPEC-3.5] Regras tributárias versionadas (PR #41, Matheus Sousa): Parametrização versionada de regras tributárias por exercício, vigência, regime, jurisdição e situação do contribuinte com motor de cálculo (RF-080, RB-004).
- [SPEC-3.6] Regimes tributários (PR #42, Matheus Sousa): Parametrização de regimes tributários e manutenção de histórico de opção, anexos/faixas, atividades, segregação de receitas e parâmetros com vigência temporal (RF-025, RF-026).
- [SPEC-3.7] Cálculo e memória de cálculo (PR #43, Matheus Sousa): Motor de cálculo tributário parametrizado por esfera, regime, atividade, município/UF, período e operação com memória de cálculo detalhada e arredondamento HALF_UP (RF-020, RF-021, RF-027, RNF-012).
- [SPEC-3.8] Retenções, créditos e parcelamentos (PR #44, Matheus Sousa): Controle de tributos retidos e sofridos, créditos tributários, compensações com controle de saldo, parcelamentos e vencimentos (RF-022).
- [SPEC-3.9] Guias e demonstrativos (PR #45, Matheus Barbosa)
- [SPEC-3.10] Divergências fiscais e contábeis (PR #57, Matheus Barbosa): Conferência e alertas de divergências entre documentos fiscais, apuração tributária e contabilidade com histórico por empresa (RF-024).
- [SPEC-3.11] Simulação de cenários (PR #58, Matheus Barbosa): Simulação comparativa de cenários tributários apresentando premissas, limitações, memória de cálculo e cenário mais econômico (RF-028).
- [SPEC-3.12] Revisão e aprovação profissional (PR #59, Matheus Barbosa): Fluxo obrigatório de conferência, revisão e aprovação por profissional autorizado antes da finalização de apurações, obrigações ou declarações (RF-029, RB-003).
- [SPEC-3.13] Ficha do contribuinte e dependentes (PR #60, José Erivan): Cadastro da ficha do contribuinte IRPF com dados pessoais, ocupação, endereço, dados bancários, alimentandos, dependentes e bloqueio de duplicidade no exercício (RF-030, RF-034).
- [SPEC-3.14] Rendimentos e deduções (PR #61, José Erivan): Coleta e consolidação de rendimentos por categoria e pagamentos/despesas dedutíveis na declaração de IRPF (RF-031, RF-033).
- [SPEC-3.15] Bens, direitos e dívidas (PR #62, José Erivan): Registro e consolidação patrimonial de bens, direitos, dívidas e ônus reais por declaração IRPF (RF-032).
- [SPEC-3.16] Importação de informes e origem dos dados (PR #63, José Erivan): Importação de informes CSV/JSON e digitação assistida com registro de exercício e distinção de origem dos dados (RF-035, RB-005).
- [SPEC-3.17] Consistência e regras do exercício (PR #64, José Erivan): Parametrização de limites por exercício fiscal e conferência de consistência entre rendimentos, IR retido, patrimônio, deduções e dependentes (RF-036, RF-041).
- [SPEC-3.18] Comparação de opções de tributação (PR #65, José Erivan): Comparador entre tributação Completa e Simplificada IRPF com teto parametrizado, estimativas e premissas (RF-037).
- [SPEC-3.19] Pendências e status (PR #66, José Erivan): Acompanhamento de status da declaração IRPF, documentos faltantes, pendências, alertas e resumo para revisão do contribuinte (RF-038, RF-040).
- [SPEC-3.20] Declaração, recibo e comprovantes (PR #67, José Erivan): Armazenamento com hash SHA-256 e controle de acesso restrito para declaração, recibo, cópia transmitida e comprovantes do cliente (RF-039).
- [SPEC-3.21] IRPJ/CSLL: base e ajustes (PR #68, José Erivan): Apuração da base de cálculo de IRPJ/CSLL com controle de adições, exclusões e compensação de prejuízos fiscais (RF-042, RF-043).
- [SPEC-3.22] IRPJ: memória de apuração e obrigações digitais (PR #69, José Erivan): Memória de apuração IRPJ/CSLL conciliada com a contabilidade, documentação de suporte e preparação de pacotes para obrigações digitais versionadas (RF-044, RF-045).
- [SPEC-4.7] Tarefas e painel de obrigações (PR #70, Douglas Augusto): Gestão de tarefas de obrigações com responsável, prazo, prioridade, checklist, anexos e painel consolidado por status incluindo atrasadas (RF-062, RF-065).
- [SPEC-4.8] Alertas de vencimento e atraso (PR #71, Douglas Augusto): Geração e registro de entrega de alertas de vencimento próximo e atraso por canais configurados com aviso auxiliar RB-009 (RF-063, RB-009).
- [SPEC-4.9] Portal do cliente (PR #72, Douglas Augusto): Envio e consulta de documentos pelo cliente e abertura/acompanhamento de solicitações de atendimento isoladas por cliente (RF-066).
- [SPEC-4.10] Organização, checklist e correções (PR #73, Douglas Augusto): Organização documental por cliente, exercício, competência, tipo e processo com busca/filtros, checklist, comentários, pedidos de correção e confirmação de recebimento (RF-067, RF-068).
- [SPEC-4.11] Acesso, retenção e consentimentos (PR #74, Douglas Augusto): Controle de políticas de acesso, download, compartilhamento, retenção/descarte e registro de consentimentos, autorizações e procurações (RF-069, RF-070).
- [SPEC-5.10] Testes funcionais e de permissão (PR #75, Pablo Eduardo): Suíte automatizada de testes funcionais ponta a ponta, validação de bloqueios por perfil (HTTP 403) e isolamento entre clientes.
- [SPEC-5.11] Testes de integração e recuperação (PR #76, Pablo Eduardo): Suíte automatizada de testes de integração entre módulos de IRPF, obrigações/alertas e validação de continuidade/recuperação operacional.
- [SPEC-5.12] Homologação, treinamento e implantação (PR #77, Pablo Eduardo): Guia de homologação, treinamento e implantação com cláusula obrigatória RB-010 e teste automatizado de prontidão (RB-010).
- [SPEC-5.2] Painéis de indicadores — implementação (PR #78, Pablo Eduardo): API consolidada de indicadores (tarefas, faturamento, inadimplência, obrigações, fechamentos e produtividade) com filtro por período, estado vazio e controle de permissão (RF-072).
- [SPEC-5.3] Relatórios em PDF, XLSX e CSV — implementação (PR #79, Pablo Eduardo): Exportação estruturada de relatórios em PDF, XLSX e CSV com controle de permissão por perfil (RF-071).
- [SPEC-5.4] Exportação controlada e saída de dados — implementação (PR #80, Pablo Eduardo): Exportação em formatos abertos (JSON/CSV) com controle de permissão e trilha de auditoria com hash SHA-256 (RF-073, RNF-015).
- [SPEC-5.5] Relatórios de auditoria — implementação (PR #81, Pablo Eduardo): Registro de eventos e emissão de relatórios de auditoria filtrados por módulo, usuário, ação e período com controle de permissão (RF-074).
- [SPEC-5.6] API documentada — implementação (PR #82, Pablo Eduardo): Contrato OpenAPI 3.0.3, página HTML de documentação, política de rate limiting (HTTP 429) e logs de acesso sanitizados com controle de permissão (RF-077).
- [SPEC-5.7] Importação e exportação validadas — implementação (PR #83, Pablo Eduardo): Validação estrutural de arquivos, detecção e prevenção de duplicidades, pré-visualização, relatório de processamento e preservação de arquivos originais com hash SHA-256 (RF-078, RB-006).
- [SPEC-5.8] Observabilidade e monitoramento — implementação (PR #84, Pablo Eduardo): Endpoint de healthcheck público, métricas operacionais com SLA de 99,5%, emissão de alertas e traces de erros com sanitização de dados sensíveis (RNF-014, RNF-005).
- [SPEC-5.9] Desempenho e carga — implementação (PR #85, Pablo Eduardo): Avaliação de SLA de resposta para 95% das telas comuns em até 3 segundos e feedback de progresso para cálculos e relatórios demorados (RNF-006).
- [Deploy] Preparação para Vercel e Supabase PostgreSQL (PR #87, João Vitor): Configuração de serverless entrypoint (api/index.ts), vercel.json, compatibilidade de banco de dados e guia de implantação.
- SPEC-5.1: Especificação em revisão de navegação, responsividade, acessibilidade, compatibilidade com navegadores, exportações em formatos abertos e documentação de requisitos de integração.
- SPEC-4.3: Portal de documentos do cliente com upload, filtros, checklist, confirmação de recebimento, correção e auditoria.

### Alterado

### Corrigido
