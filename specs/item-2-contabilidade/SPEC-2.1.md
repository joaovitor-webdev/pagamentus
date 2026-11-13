# SPEC-2.1 – Plano de contas

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade e financeiro | Ítalo | A definir | A definir | Revisando |

## 1. Contexto e objetivo
Estabelecer a estrutura fundamental do Plano de Contas contábil por organização/empresa, permitindo a classificação hierárquica de contas sintéticas e analíticas, com suporte a naturezas contábeis (Ativo, Passivo, Patrimônio Líquido, Receitas e Despesas) e garantindo a regra central de que lançamentos contábeis só podem ser realizados em contas analíticas.

## 2. Requisitos relacionados
- **RF-006**: Manter plano de contas configurável por empresa, com códigos, níveis, natureza, classificação e contas sintéticas/analíticas.
- **RNF-001**: Isolamento de dados por organização.
- **RNF-009**: Interface responsiva e usabilidade consistente.
- **RNF-011**: Código versionado, padrões, documentação e testes automatizados.
- **RNF-013**: Integridade de dados e validação de regras contábeis.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de contas com: código estruturado (ex.: 1, 1.1, 1.1.01), nome, natureza contábil, tipo (sintética ou analítica) e status (ativa/inativa).
  - Organização e validação hierárquica (uma conta filha analítica deve ter pai sintético existente).
  - Consulta e listagem hierárquica (em árvore) e tabular, com filtros por natureza, tipo e status.
  - Edição de dados cadastrais permitidos.
  - Desativação lógica com validação (bloquear desativação se houver contas filhas ativas).
  - Sinalização de aptidão para lançamentos: impedir lançamento em conta sintética e liberar exclusivamente para analítica.
  - Isolamento por organização (`organization_id`).
- **Fora do escopo:**
  - Importação de planos de contas via SPED ou arquivos externos (pertencente a itens de integração futura).
  - Lançamento contábil de partidas dobradas propriamente dito (pertencente à SPEC-2.2).

## 4. Comportamento esperado
- **Fluxo normal:** O usuário acessa a tela de Plano de Contas, visualiza a estrutura hierárquica das contas cadastradas. Clica em "Nova Conta", informa código (ex: `1.1.01.001`), nome (ex: `Caixa Geral`), seleciona a natureza (`ATIVO`), escolhe a classificação `ANALÍTICA` e salva. A conta é criada com sucesso e exibida na árvore.
- **Fluxo de validação/erro 1:** O usuário tenta cadastrar uma conta com código já existente na mesma organização. O sistema rejeita com mensagem "Código contábil já cadastrado para esta organização".
- **Fluxo de validação/erro 2:** O usuário ou módulo contábil tenta efetuar movimentação/lançamento em uma conta com classificação `SINTETICA`. O sistema rejeita com mensagem "Lançamentos contábeis são permitidos exclusivamente em contas analíticas".
- **Fluxo de validação/erro 3:** O usuário tenta desativar uma conta sintética que ainda possui contas filhas ativas. O sistema bloqueia a operação informando a dependência existente.

## 5. Critérios de aceite
- **CA-1:** Dado um usuário autenticado em uma organização, quando submeter o cadastro de uma conta contábil sintética (ex.: `1 - ATIVO`) com código, nome e natureza, então a conta deve ser persistida com sucesso e identificada como sintética.
- **CA-2:** Dado o plano de contas existente, quando cadastrada uma conta analítica vinculada à estrutura hierárquica (ex.: `1.1.01.001 - Caixa Geral`), então o registro deve ser salvo como analítico e marcado como apto para receber lançamentos.
- **CA-3:** Dado o cadastro de contas, quando consultada a listagem, então o sistema deve retornar a organização hierárquica ordenada por código contábil.
- **CA-4:** Dado o módulo de lançamentos ou tentativa de operação contábil, quando referenciada uma conta sintética, então o sistema deve rejeitar a operação informando que contas sintéticas não aceitam lançamentos.
- **CA-5:** Dado um pedido de desativação de conta contábil, quando a conta possuir contas filhas ativas, então a desativação deve ser bloqueada com mensagem clara.
- **CA-6:** Dado um pedido de cadastro com código duplicado na mesma organização, então o sistema deve rejeitar a operação garantindo a unicidade do código por organização.

## 6. Plano técnico
- **Tabela / Entidade:** `contas_contabeis`
  - `id` (UUID/PK)
  - `organization_id` (UUID / chave de inquilino)
  - `codigo` (VARCHAR ex.: '1.1.01.001')
  - `nome` (VARCHAR)
  - `natureza` (ENUM: 'ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA')
  - `tipo` (ENUM: 'SINTETICA', 'ANALITICA')
  - `nivel` (INTEGER)
  - `conta_pai_id` (UUID / FK opcional)
  - `status` (ENUM: 'ATIVA', 'INATIVA')
  - `created_at`, `updated_at`
- **Rotas / Endpoints:**
  - `GET /api/contabilidade/contas` (listagem com filtros)
  - `POST /api/contabilidade/contas` (criação com validações)
  - `GET /api/contabilidade/contas/:id` (obter detalhes)
  - `PUT /api/contabilidade/contas/:id` (atualização cadastral)
  - `PATCH /api/contabilidade/contas/:id/status` (ativação/desativação com validação de filhas)
- **Interface:**
  - Componente de visualização em árvore hierárquica expansível.
  - Tabela organizada com paginação e busca por código/nome.
  - Modal moderno para criação/edição com seleção dinâmica de tipo (Sintética/Analítica) e natureza.

## 7. Tarefas de implementação
- [x] Elaborar especificação técnica detalhada (`specs/item-2-contabilidade/SPEC-2.1.md`)
- [x] Configurar a infraestrutura modular em `src/` com suporte a persistência e transações
- [x] Implementar modelo e repositório de Contas Contábeis (`src/modules/contabilidade/`)
- [x] Implementar regras de negócio e validações (hierarquia, analítica vs sintética, unicidade)
- [x] Implementar endpoints da API REST para gestão do plano de contas
- [x] Desenvolver interface visual com layout administrativo, menu lateral e visualização em árvore
- [x] Criar suíte de testes automatizados para os critérios CA-1 a CA-6
- [x] Registrar evidências de validação e atualizar CHANGELOG.md

## 8. Dependências
- Nenhuma dependência externa impeditiva. Modelo compatível com SPEC-1.3.

## 9. Como validar
1. **Validação de contas sintéticas e analíticas (CA-1, CA-2):**
   - Executar os testes automatizados com `npm test`.
   - Cadastrar uma conta sintética `1 - ATIVO` e uma conta analítica `1.1.01.001 - Caixa Geral`.
2. **Validação de hierarquia e unicidade (CA-3, CA-6):**
   - Listar contas e verificar a ordenação do código.
   - Tentar cadastrar outra conta com código `1` e validar a rejeição com erro 400/409.
3. **Validação de bloqueio de lançamento em sintética (CA-4):**
   - Chamar a validação de aptidão para lançamento contábil contra a conta sintética e verificar o bloqueio.
4. **Validação de desativação (CA-5):**
   - Tentar inativar conta sintética pai e validar a recusa enquanto houver filhas ativas.

## 10. Evidências (preencher ao concluir)
- **CA-1 (Conta Sintética):** Teste automatizado aprovado (`ok 1 - SPEC-2.1: CA-1 - Cadastro de conta sintética com código, nome e natureza`).
- **CA-2 (Conta Analítica):** Teste automatizado aprovado (`ok 2 - SPEC-2.1: CA-2 - Cadastro de conta analítica vinculada a uma sintética`).
- **CA-3 (Hierarquia e Ordenação):** Teste automatizado aprovado (`ok 3 - SPEC-2.1: CA-3 - Organização hierárquica e ordenação por código`).
- **CA-4 (Bloqueio de Lançamento em Sintética):** Teste automatizado aprovado (`ok 4 - SPEC-2.1: CA-4 - Bloqueio de lançamentos contábeis em contas sintéticas` - rejeição estrita com mensagem explicativa).
- **CA-5 (Bloqueio de Desativação):** Teste automatizado aprovado (`ok 5 - SPEC-2.1: CA-5 - Bloqueio de desativação de conta com filhas ativas`).
- **CA-6 (Unicidade de Código):** Teste automatizado aprovado (`ok 6 - SPEC-2.1: CA-6 - Rejeição de código duplicado na mesma organização`).
- **Resumo de Execução dos Testes:** 6/6 testes passaram em 341ms. Status: 100% OK.

## 11. Histórico de revisão
*Nenhuma ressalva registrada até o momento.*
