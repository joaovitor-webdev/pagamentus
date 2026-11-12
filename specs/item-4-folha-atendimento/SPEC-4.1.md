# SPEC-4.1 – Cadastro de Empregados, Contratos e Folha de Pagamento

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | Revisor (4º período) | [Cartão SPEC-4.1](https://trello.com/c/spec-4-1) | Feito |

## 1. Contexto e objetivo
Esta especificação define e implementa o núcleo operacional do **Item 4 (Folha de Pagamento, Obrigações e Atendimento ao Cliente)** do Sistema Integrado de Contabilidade, Fiscal e IR.
O objetivo é fornecer um módulo robusto, autônomo e de alta confiabilidade para:
- Cadastro e gestão integral de empregados, contratos e dependentes;
- Simulação e cálculo de folha mensal, férias, 13º salário e encargos com parâmetros fictícios auditáveis;
- Registro de eventos variáveis (horas extras, faltas, adicionais) e afastamentos temporários/licenças;
- Geração de recibos de pagamento (holerite simplificado) e demonstrativo de provisões mensais (13º e férias);
- Preparação de arquivos estruturados no padrão dos sistemas oficiais (ex: eventos do eSocial S-1000, S-2200, S-2230, S-1200) para conferência prévia, em conformidade com as diretrizes do escopo (sem transmissão externa direta arbitrária);
- Controle de acesso baseado em papéis (RBAC) com mascaramento dinâmico de dados sensíveis e salariais (LGPD) para perfis de consulta, além de trilha de auditoria para aprovação de folha.

## 2. Requisitos relacionados
- **Requisitos Funcionais**:
  - `RF-051`: Cadastrar empregados e contratos, cargos, salários, jornadas, dependentes e dados obrigatórios com acesso restrito.
  - `RF-052`: Preparar cálculos de folha, férias, 13º, rescisões, adicionais, descontos e encargos conforme parâmetros legais vigentes (com parâmetros fictícios configuráveis).
  - `RF-053`: Registrar eventos variáveis, ponto importado, afastamentos, licenças, benefícios e alterações contratuais.
  - `RF-054`: Preparar eventos e informações para sistemas oficiais de folha/trabalho quando aplicável, conforme leiaute vigente (eSocial simulado para conferência).
  - `RF-055`: Gerar recibos, relatórios de folha, provisões, encargos e lançamentos contábeis integrados.
  - `RF-056`: Manter trilha de aprovação e restringir dados salariais e de saúde a usuários autorizados.
- **Requisitos Não Funcionais**:
  - `RNF-001`: Segurança e segregação de acesso conforme menor privilégio.
  - `RNF-002`: LGPD e privacidade (dados 100% fictícios, mascaramento de CPF e remuneração).
  - `RNF-004`: Auditoria com registro de ações relevantes, usuário, timestamp e operação.
  - `RNF-009`: Interface responsiva, clara e usável em desktop e mobile sem necessidade de build complexo.
  - `RNF-012`: Confiabilidade dos cálculos, arredondamento documentado e memória de cálculo reproduzível.
- **Regras de Negócio**:
  - `RB-003`: Nenhuma folha/apuração será marcada como aprovada sem revisão de usuário autorizado (perfil RH/Admin).
  - `RB-010`: Parâmetros fiscais e trabalhistas fictícios documentados, sem promessa de transmissão automática desautorizada.

## 3. Escopo

### Dentro do escopo:
1. **CRUD Completo de Empregados e Contratos (RF-051)**:
   - Inclusão, listagem, atualização, visualização e inativação/exclusão de empregados.
   - Atributos: nome completo, CPF fictício, cargo, salário base, jornada de trabalho (ex: 44h semanais), data de admissão, status (`ativo`, `afastado`, `inativo`) e quantidade de dependentes.
2. **Cálculos de Folha Parametrizáveis (RF-052)**:
   - Motor de cálculo para folha mensal, férias (com 1/3 constitucional) e 13º salário (1ª e 2ª parcelas).
   - Deduções progressivas fictícias de INSS (tabela progressiva de faixas) e IRRF (com dedução por dependente).
   - Cálculo de FGTS mensal (8%) e encargos patronais (20% INSS empresa + 2% RAT + 5.8% Terceiros).
   - Tela de parametrização e simulação com memória de cálculo detalhada passo a passo.
3. **Eventos Variáveis, Afastamentos e Histórico Contratual (RF-053)**:
   - Registro de horas extras (50% e 100%), faltas (dias e cálculo de desconto), adicionais (noturno, periculosidade, insalubridade, gratificações) e outros descontos.
   - Registro de afastamentos/licenças com data de início, término previsto, motivo e tipo (maternidade, doença, etc.).
   - Histórico de alterações contratuais (reajustes, promoções, mudança de jornada).
4. **Preparação de Arquivo para Sistemas Oficiais (RF-054)**:
   - Geração e download de arquivo estruturado nos formatos JSON e TXT seguindo o leiaute conceitual do eSocial (Eventos S-1000 Empregador, S-2200 Admissão, S-2230 Afastamentos e S-1200 Remuneração).
   - Visualizador/validador em tela para conferência contábil prévia, sem tentativa de envio externo.
5. **Recibos (Holerite) e Provisões (RF-055)**:
   - Geração de holerite simplificado com cabeçalho da empresa, dados do empregado, tabela de proventos e descontos, bases de cálculo e valor líquido.
   - Função amigável para impressão / exportação direta (CSS `@media print`).
   - Painel de Provisões: Provisão mensal de 13º salário (1/12), Provisão mensal de férias (1/12 + 1/3) e encargos incidentes.
6. **Segurança, Perfis Simulados e Trilha de Aprovação (RF-056)**:
   - Seletor global de perfil: "Perfil RH/Admin" vs "Perfil Consulta/Assistente".
   - Mascaramento em duas camadas (API e UI) quando o perfil for "Consulta/Assistente": salários e remunerações retornam `R$ *****,**` e CPFs são ofuscados.
   - Bloqueio de ações de aprovação/fechamento para perfis não autorizados (HTTP 403).
   - Trilha de aprovação da folha gravada em tabela de auditoria (`payroll_approval_logs`).

### Fora do escopo:
- Transmissão telemática real com certificados digitais ICP-Brasil (A1/A3) para os servidores da Receita/eSocial (proibido pela RB-010 e diretrizes do escopo).
- Gestão biométrica de ponto em tempo real.
- Integração bancária direta para liquidação de TED/PIX via CNAB 240.

## 4. Comportamento esperado

### Fluxo Normal:
1. O usuário acessa a aplicação; o sistema inicializa com 3 empregados pré-populados com dados 100% fictícios.
2. Em **Empregados**, o usuário pode cadastrar novos colaboradores, editar dados existentes ou registrar alterações contratuais e afastamentos.
3. Em **Lançamentos & Eventos**, o usuário seleciona a competência (ex: 2026-11) e adiciona horas extras, faltas ou adicionais.
4. Em **Processamento de Folha**, o sistema calcula todos os proventos, deduções de INSS/IRRF, encargos patronais e provisões. O usuário confere a memória de cálculo.
5. Em **Recibos & Provisões**, o usuário visualiza o holerite individual formatado e o resumo geral das provisões de 13º e férias da empresa.
6. O usuário com **Perfil RH/Admin** aprova a folha; a ação é auditada e registrada.
7. Em **Exportação eSocial**, o usuário gera e baixa o arquivo JSON/TXT com os eventos estruturados para conferência.
8. Ao alternar o seletor no topo para **Perfil Consulta/Assistente**, os dados salariais e sensíveis são instantaneamente mascarados tanto visualmente quanto no tráfego da API, e o botão de aprovação é desabilitado.

### Fluxo de Exceção:
1. Tentativa de cadastro com CPF inválido ou duplicado: sistema rejeita e informa o erro amigavelmente.
2. Tentativa de aprovação de folha usando o perfil de consulta: a API retorna código HTTP 403 com mensagem de bloqueio.
3. Tentativa de cálculo de folha para competência sem empregados ativos: sistema alerta adequadamente sem falha de execução.

## 5. Critérios de aceite

- **CA-1 (Cadastro e Contratos - RF-051)**:
  - **Dado** que o usuário está no perfil RH/Admin,
  - **Quando** ele preenche e envia o formulário de cadastro com nome, CPF fictício, cargo, salário base, jornada, data de admissão e dependentes,
  - **Então** o registro é salvo no SQLite e exibido na listagem com opções para editar, visualizar e inativar.

- **CA-2 (Cálculo e Memória da Folha - RF-052)**:
  - **Dado** que há empregados ativos e eventos lançados para uma competência,
  - **Quando** o usuário solicita o cálculo da folha mensal, férias ou 13º salário,
  - **Então** o sistema calcula proventos, descontos progressivos (INSS, IRRF) e encargos patronais (FGTS 8%, INSS patronal), apresentando a memória de cálculo detalhada com bases e alíquotas.

- **CA-3 (Eventos Variáveis e Afastamentos - RF-053)**:
  - **Dado** um empregado existente,
  - **Quando** o usuário lança horas extras, faltas, adicionais ou registra um afastamento temporário,
  - **Então** os eventos ficam vinculados ao contrato do empregado e são automaticamente incorporados ao cálculo da folha da respectiva competência.

- **CA-4 (Arquivo Estruturado eSocial - RF-054)**:
  - **Dado** uma competência com folha calculada e empregados cadastrados,
  - **Quando** o usuário aciona o botão "Gerar Arquivo eSocial (JSON/TXT)",
  - **Então** o sistema gera e dispara o download de um arquivo padronizado contendo os eventos S-1000, S-2200, S-2230 e S-1200 devidamente estruturados para conferência.

- **CA-5 (Holerite e Provisões - RF-055)**:
  - **Dado** o cálculo da folha de um empregado,
  - **Quando** o usuário clica em "Ver Holerite",
  - **Então** o sistema renderiza o recibo formal de pagamento com discriminação de proventos, descontos, bases legais e salário líquido, além de exibir o quadro consolidado de provisões mensais (13º e férias).

- **CA-6 (Controle de Acesso, Mascaramento e Aprovação - RF-056)**:
  - **Dado** que o seletor está configurado como "Perfil Consulta/Assistente",
  - **Quando** o usuário visualiza qualquer tela ou dispara requisições para a API,
  - **Então** os valores de salários, proventos, descontos e CPF são mascarados (`R$ *****,**`) tanto no JSON da API quanto na interface, e qualquer tentativa de aprovação é bloqueada;
  - **E Dado** que o usuário está no "Perfil RH/Admin",
  - **Quando** ele clica em "Aprovar Folha",
  - **Então** a folha muda de status para "Aprovada" e um registro é gravado na trilha de auditoria.

## 6. Plano técnico

### 6.1 Arquitetura e Stack
- **Ambiente de Execução**: Node.js v26+ com Express 5.
- **Banco de Dados**: SQLite embarcado via `better-sqlite3` (rápido, síncrono, persistente e sem dependências externas).
- **Frontend**: Single Page Application (SPA) em HTML5, JavaScript Vanilla modular, Tailwind CSS via CDN e Heroicons.
- **Configuração**: Carregamento de variáveis via `.env` (`PORT`, `DATABASE_PATH`).

### 6.2 Modelo de Dados (SQLite)
- `employees`: `id, nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes, created_at, updated_at`.
- `contract_changes`: `id, employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao, created_at`.
- `leaves`: `id, employee_id, tipo, data_inicio, data_fim, motivo, created_at`.
- `variable_events`: `id, employee_id, competencia, tipo, descricao, quantidade, percentual, valor, created_at`.
- `payroll_runs`: `id, competencia, tipo, status, total_proventos, total_descontos, total_liquido, total_encargos, created_at, updated_at`.
- `payroll_items`: `id, payroll_run_id, employee_id, salario_base, horas_extras_total, adicionais_total, faltas_total, desconto_inss, desconto_irrf, outros_descontos, total_proventos, total_descontos, salario_liquido, base_inss, base_fgts, valor_fgts, inss_patronal, detalhes_json, created_at`.
- `payroll_approval_logs`: `id, payroll_run_id, competencia, usuario, perfil, acao, detalhes, data_hora`.
- `system_parameters`: `chave, valor, descricao` (tabelas e parâmetros legais fictícios).

### 6.3 Endpoints da API REST
| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/employees` | Lista empregados (com suporte a mascaramento por perfil) |
| `POST` | `/api/employees` | Cadastra novo empregado |
| `GET` | `/api/employees/:id` | Obtém dados de um empregado |
| `PUT` | `/api/employees/:id` | Atualiza dados cadastrais |
| `DELETE` | `/api/employees/:id` | Inativa/remove empregado |
| `POST` | `/api/employees/:id/contract-changes` | Registra alteração contratual |
| `POST` | `/api/employees/:id/leaves` | Registra licença/afastamento |
| `GET` | `/api/events` | Lista eventos variáveis por competência |
| `POST` | `/api/events` | Registra novo evento variável (horas extras, faltas, etc.) |
| `DELETE` | `/api/events/:id` | Remove evento variável |
| `POST` | `/api/payroll/calculate` | Executa cálculo de folha mensal/férias/13º |
| `GET` | `/api/payroll/preview/:competencia` | Obtém prévia e resumo de provisões |
| `GET` | `/api/payroll/receipt/:competencia/:employeeId` | Emite dados do holerite detalhado |
| `POST` | `/api/payroll/approve` | Aprova/fecha folha (restrito a RH/Admin) |
| `GET` | `/api/payroll/audit-logs` | Lista trilha de auditoria e aprovações |
| `GET` | `/api/esocial/export/:competencia` | Gera arquivo estruturado (JSON/TXT) |
| `GET` | `/api/parameters` | Lista e atualiza parâmetros fictícios de cálculo |

## 7. Tarefas de implementação
- [x] Configuração da infraestrutura do projeto (`package.json`, `.env`, dependências).
- [x] Criação do schema do banco SQLite e seeding de 3 colaboradores fictícios (LGPD).
- [x] Implementação dos serviços de cálculo (folha, férias, 13º, encargos e provisões).
- [x] Implementação dos serviços de mascaramento (LGPD) e RBAC.
- [x] Implementação do gerador de arquivos estruturados eSocial (RF-054).
- [x] Criação das rotas RESTful no Express com tratamento de erros.
- [x] Desenvolvimento da interface em Vanilla JS + Tailwind CSS com abas:
  - Painel Geral / Dashboard
  - Empregados e Contratos (CRUD)
  - Eventos Variáveis e Afastamentos
  - Cálculo de Folha e Memória
  - Holerite e Provisões
  - Exportação eSocial
  - Trilha de Auditoria & Aprovação
- [x] Testes automatizados das rotas e validação dos critérios de aceite.

## 8. Dependências
- Nenhuma dependência externa bloqueante; utiliza SQLite local embutido e Tailwind CSS via CDN.

## 9. Como validar
1. Inicie a aplicação com `npm start` e acerte o endereço `http://localhost:3000`.
2. Verifique os 3 empregados fictícios já cadastrados na aba **Empregados**.
3. Crie um novo empregado e registre uma alteração contratual ou afastamento.
4. Na aba **Eventos Variáveis**, adicione 10 horas extras para um funcionário na competência atual.
5. Na aba **Cálculo de Folha**, clique em "Calcular Folha" e examine a memória de cálculo.
6. Na aba **Holerite e Provisões**, abra o recibo de pagamento e visualize o resumo de provisões de 13º e férias.
7. Alterne o seletor no topo para **Perfil Consulta/Assistente**:
   - Confira que salários e valores viraram `R$ *****,**` e CPFs estão ofuscados.
   - Verifique que o botão de aprovação de folha é bloqueado.
8. Retorne ao perfil **RH/Admin**, clique em "Aprovar Folha" e consulte a **Trilha de Auditoria**.
9. Na aba **Exportação eSocial**, gere e baixe o arquivo JSON/TXT estruturado.

## 10. Evidências (preencher ao concluir)
- Servidor operando na porta 3000 com saída limpa.
- Todos os testes de integração e endpoints respondendo com código 200/201 e 403 para acessos não autorizados.
- Logs de auditoria gravados no banco SQLite `data/payroll.sqlite`.

## 11. Histórico de revisão
- **Revisão Inicial (11/11/2026)**: Especificação criada e aprovada pelo responsável Douglas para atendimento aos requisitos RF-051 a RF-056.
