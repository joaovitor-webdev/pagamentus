# SPEC-2.2 – Lançamento contábil com partidas dobradas

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade e financeiro | Ítalo | A definir | A definir | Revisando |

## 1. Contexto e objetivo
Garantir o registro contábil de fatos patrimoniais mediante o método das partidas dobradas, assegurando a integridade contábil, a rastreabilidade e o cumprimento irrestrito da Regra de Negócio RB-001, na qual todo lançamento contábil deve ser rigorosamente balanceado ($\sum \text{Débitos} = \sum \text{Créditos}$). Lançamentos contábeis devem utilizar exclusivamente contas analíticas ativas.

## 2. Requisitos relacionados
- **RF-007**: Registrar lançamentos manuais e automáticos com data, competência, histórico, documento de origem e partidas de débito/crédito.
- **RF-008**: Validar partidas dobradas, período aberto, contas ativas e consistência dos valores antes de gravar.
- **RB-001**: Todo lançamento contábil deve estar balanceado; débitos e créditos devem ser iguais.
- **RNF-001**: Isolamento de dados por organização (`organization_id`).
- **RNF-004**: Trilha de auditoria das inclusões e alterações.
- **RNF-013**: Integridade transacional e validação rigorosa de inconsistências.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de lançamentos contábeis com número/identificador, data de lançamento, data de competência, histórico descritivo e valor total.
  - Seleção e validação de contas contábeis envolvidas: **apenas contas analíticas ativas** são aceitas.
  - Composição de partidas dobradas contendo ao menos uma conta debitada e uma conta creditada (suporte a lançamentos simples 1D:1C ou complexos múltiplos débitos/créditos).
  - Validação de equilíbrio obrigatório: bloqueio automático caso a soma de débitos difira da soma de créditos.
  - Mensagem de erro descritiva e explicativa caso haja desbalanceamento, indicando a diferença encontrada.
  - Persistência atômica via transação de banco de dados.
  - Consulta, listagem e detalhamento de lançamentos por período e organização.
- **Fora do escopo:**
  - Encerramento de exercício e apuração de resultado (DRE) – fases posteriores.
  - Estorno automático em lote sem ação do usuário.

## 4. Comportamento esperado
- **Fluxo normal:** O usuário acessa a tela de Lançamentos Contábeis, seleciona a data, informa o histórico (ex.: "Pagamento de fornecedor fictício referente NF 1020"), seleciona a conta analítica a Débito (ex.: `2.1.01.001 - Fornecedores Nacionais`) com R$ 1.500,00 e a conta analítica a Crédito (ex.: `1.1.01.001 - Caixa Geral`) com R$ 1.500,00. O sistema calcula a soma dos débitos (R$ 1.500,00), a soma dos créditos (R$ 1.500,00) e exibe o indicador de equilíbrio em verde ("Equilibrado"). Ao clicar em salvar, a transação é efetivada e o lançamento é gravado.
- **Fluxo de restrição/erro 1 (Desbalanceamento):** O usuário preenche um débito de R$ 1.000,00 e um crédito de R$ 800,00 (diferença de R$ 200,00). O sistema sinaliza o desbalanceamento em vermelho e bloqueia a gravação. Se o envio for forçado via API, o backend rejeita com status 400 e mensagem clara: "Lançamento desbalanceado rejeitado: soma dos débitos (R$ 1.000,00) difere da soma dos créditos (R$ 800,00). Diferença: R$ 200,00".
- **Fluxo de restrição/erro 2 (Conta sintética):** O usuário tenta selecionar uma conta classificada como sintética. O sistema rejeita informando que lançamentos só são permitidos em contas analíticas.

## 5. Critérios de aceite
- **CA-1:** Dado um conjunto de partidas onde o total de débitos é rigorosamente igual ao total de créditos, quando submetido o lançamento contábil com data, histórico e contas analíticas ativas, então o lançamento deve ser salvo com sucesso gerando número sequencial/identificador.
- **CA-2:** Dado um conjunto de partidas onde a soma dos débitos difere da soma dos créditos, quando for tentada a gravação do lançamento, então o sistema deve recusar a operação e retornar mensagem de erro explícita com a diferença apurada.
- **CA-3:** Dado um lançamento contábil, quando uma das contas selecionadas for classificada como sintética, então o sistema deve bloquear a operação indicando que lançamentos exigem contas analíticas.
- **CA-4:** Dado um lançamento válido, quando consultado o histórico de lançamentos com filtro por organização e período, então o sistema deve retornar os lançamentos com suas respectivas partidas detalhadas.
- **CA-5:** Dado um lançamento contábil, quando os valores de débito ou crédito forem menores ou iguais a zero, então o sistema deve rejeitar a operação.

## 6. Plano técnico
- **Tabelas / Entidades:**
  - `lancamentos_contabeis`:
    - `id` (UUID/PK)
    - `organization_id` (UUID)
    - `numero` (BIGINT / sequencial ou formatado)
    - `data_lancamento` (DATE)
    - `competencia` (VARCHAR YYYY-MM)
    - `historico` (TEXT)
    - `valor_total` (DECIMAL(15,2))
    - `status` (ENUM: 'EFETIVADO', 'ESTORNADO')
    - `created_at`, `created_by`
  - `partidas_lancamento`:
    - `id` (UUID/PK)
    - `lancamento_id` (UUID/FK)
    - `conta_id` (UUID/FK referenciando `contas_contabeis`)
    - `tipo` (ENUM: 'DEBITO', 'CREDITO')
    - `valor` (DECIMAL(15,2))
    - `historico_complementar` (VARCHAR opcional)
- **Endpoints:**
  - `GET /api/contabilidade/lancamentos`: listagem de lançamentos com paginação e busca por data.
  - `POST /api/contabilidade/lancamentos`: criação transacional de lançamento com validação de partidas dobradas e contas analíticas.
  - `GET /api/contabilidade/lancamentos/:id`: recuperação dos dados completos de um lançamento e suas partidas.
- **Interface:**
  - Formulário intuitivo de partidas múltiplas, permitindo adicionar/remover linhas de débito e crédito.
  - Barramento de equilíbrio visual permanente: Total Débitos, Total Créditos, Diferença e Status (Equilibrado / Desbalanceado).
  - Tabela organizada com ordenação, filtro de período e modal para visualização das partidas.

## 7. Tarefas de implementação
- [x] Elaborar especificação técnica detalhada (`specs/item-2-contabilidade/SPEC-2.2.md`)
- [x] Implementar modelos e repositórios de Lançamento e Partidas
- [x] Implementar validador estrito de partidas dobradas e contas analíticas
- [x] Implementar serviço transacional de gravação atômica
- [x] Implementar rotas e controladores de Lançamentos
- [x] Desenvolver interface reativa com cálculo de equilíbrio em tempo real
- [x] Criar suíte de testes automatizados para os critérios CA-1 a CA-5
- [x] Registrar evidências de validação e atualizar CHANGELOG.md

## 8. Dependências
- `SPEC-2.1` (Plano de Contas – requer contas analíticas existentes para amarração).

## 9. Como validar
1. **Lançamento equilibrado (CA-1):**
   - Submeter lançamento com Débito R$ 500,00 e Crédito R$ 500,00. Verificar HTTP 201 e persistência.
2. **Rejeição de desbalanceado (CA-2):**
   - Submeter lançamento com Débito R$ 500,00 e Crédito R$ 450,00. Verificar HTTP 400 e mensagem de bloqueio.
3. **Bloqueio de conta sintética (CA-3):**
   - Submeter lançamento apontando conta sintética. Verificar HTTP 400 informando conta inválida para lançamento.
4. **Consulta e consistência (CA-4):**
   - Consultar lançamentos por período e checar as partidas debitadas e creditadas.

## 10. Evidências (preencher ao concluir)
- **CA-1 (Equilíbrio e Efetivação):** Teste automatizado aprovado (`ok 1 - SPEC-2.2: CA-1 - Lançamento contábil equilibrado é aceito com sucesso` - gera número sequencial e persiste partidas).
- **CA-2 (REGRA FUNDAMENTAL RB-001):** Teste automatizado aprovado (`ok 2 - SPEC-2.2: CA-2 - REGRA FUNDAMENTAL RB-001: Bloqueio estrito de lançamento desbalanceado` - rejeição atômica com cálculo explícito da diferença apurada).
- **CA-3 (Bloqueio de Conta Sintética):** Teste automatizado aprovado (`ok 3 - SPEC-2.2: CA-3 - Bloqueio de lançamento contábil em conta sintética` - impede seleção de conta mãe).
- **CA-4 (Histórico e Consulta):** Teste automatizado aprovado (`ok 4 - SPEC-2.2: CA-4 - Histórico e consulta de lançamentos com detalhamento das partidas`).
- **CA-5 (Validação de Valores):** Teste automatizado aprovado (`ok 5 - SPEC-2.2: CA-5 - Rejeição de valores menores ou iguais a zero`).
- **Resumo de Execução dos Testes:** 5/5 testes passaram em 373ms. Status: 100% OK.

## 11. Histórico de revisão
*Nenhuma ressalva registrada até o momento.*
