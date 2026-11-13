# SPEC-2.3 – Contas a pagar e a receber

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade e financeiro | Ítalo | A definir | A definir | Revisando |

## 1. Contexto e objetivo
Fornecer o controle financeiro de contas a pagar e contas a receber da organização, com suporte a parcelamento, controle de datas de vencimento, gestão de saldos pendentes e liquidação através de baixa total ou baixa parcial, garantindo a atualização automática e consistente dos saldos dos títulos.

## 2. Requisitos relacionados
- **RF-046**: Cadastrar títulos, parcelas, fornecedores, clientes, vencimentos, condições de pagamento e categorias.
- **RF-047**: Controlar pagamentos, recebimentos, baixas parciais, juros, multas, descontos, estornos e inadimplência.
- **RNF-001**: Isolamento de dados por organização.
- **RNF-009**: Interface responsiva e usabilidade financeira ágil.
- **RNF-011**: Código versionado, testes automatizados e arquitetura manutenível.
- **RNF-013**: Integridade transacional dos saldos e baixas.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de títulos de Contas a Pagar (fornecedores) e Contas a Receber (clientes) com descrição, valor total e condição de parcelamento.
  - Geração automática de parcelas com número, vencimento, valor e saldo pendente.
  - Baixa total de parcela (liquidação integral do valor em aberto).
  - Baixa parcial de parcela com recálculo automático do saldo remanescente.
  - Status dos títulos e parcelas: `PENDENTE`, `PARCIAL`, `PAGO` e `CANCELADO`.
  - Histórico de pagamentos/baixas efetuadas com data, valor pago, acréscimos e descontos.
  - Painel financeiro com totais consolidados: a pagar, a receber, vencidos, pendentes e quitados.
  - Isolamento por organização (`organization_id`).
- **Fora do escopo:**
  - Geração ou conciliação automática de lançamentos contábeis decorrentes das baixas (conforme orientação do escopo, operações contábeis automáticas não devem ser executadas sem previsão expressa).
  - Emissão de boletos bancários ou remessa/retorno CNAB bancário.

## 4. Comportamento esperado
- **Fluxo normal (Cadastro):** O usuário cadastra um título a pagar no valor de R$ 3.000,00 em 3 parcelas mensais. O sistema cria o título e gera 3 parcelas de R$ 1.000,00 cada, com vencimentos sequenciais (ex: 30, 60, 90 dias).
- **Fluxo normal (Baixa Parcial):** O usuário seleciona a parcela 1 de R$ 1.000,00 e registra uma baixa parcial de R$ 400,00. O sistema atualiza o saldo pendente da parcela para R$ 600,00, altera o status da parcela para `PARCIAL` e mantém o status do título compatível.
- **Fluxo normal (Baixa Total):** O usuário registra a baixa dos R$ 600,00 restantes. O saldo pendente passa a R$ 0,00 e o status da parcela passa para `PAGO`. Quando todas as parcelas de um título estão pagas, o título é atualizado para `PAGO`.
- **Fluxo de erro/restrição:** O usuário tenta efetuar uma baixa com valor superior ao saldo em aberto da parcela. O sistema rejeita com mensagem: "Valor da baixa excede o saldo pendente da parcela".

## 5. Critérios de aceite
- **CA-1:** Dado o cadastro de uma conta a pagar ou a receber com valor e número de parcelas, quando salvo, então o sistema deve persistir o título e gerar suas respectivas parcelas com datas de vencimento e saldos individuais.
- **CA-2:** Dado um título com parcelas pendentes, quando realizada uma baixa parcial em uma parcela, então o sistema deve reduzir o saldo pendente pelo valor exato pago e classificar a parcela como parcialmente paga (`PARCIAL`).
- **CA-3:** Dado um título com saldo em aberto, quando realizada uma baixa total (integral do saldo restante), então a parcela deve ser marcada como `PAGO` e o saldo pendente zerado.
- **CA-4:** Dado um título onde todas as parcelas foram integralmente quitadas, então o status consolidado do título principal deve ser atualizado para `PAGO`.
- **CA-5:** Dado um pedido de baixa com valor monetário superior ao saldo remanescente da parcela, então a operação deve ser rejeitada com mensagem de erro explícita.
- **CA-6:** Dado o painel financeiro, quando consultado, então os títulos devem ser exibidos organizados por status (`PENDENTE`, `PARCIAL`, `PAGO`), tipo (`PAGAR`, `RECEBER`) e com saldo consolidado correto.

## 6. Plano técnico
- **Tabelas / Entidades:**
  - `titulos_financeiros`:
    - `id` (UUID/PK)
    - `organization_id` (UUID)
    - `tipo` (ENUM: 'PAGAR', 'RECEBER')
    - `pessoa_nome` (VARCHAR ex.: 'Fornecedor Exemplo Ltda')
    - `descricao` (VARCHAR)
    - `valor_total` (DECIMAL(15,2))
    - `quantidade_parcelas` (INTEGER)
    - `data_emissao` (DATE)
    - `status` (ENUM: 'PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO')
  - `parcelas_financeiras`:
    - `id` (UUID/PK)
    - `titulo_id` (UUID/FK)
    - `numero_parcela` (INTEGER)
    - `data_vencimento` (DATE)
    - `valor_original` (DECIMAL(15,2))
    - `valor_pago` (DECIMAL(15,2))
    - `saldo_pendente` (DECIMAL(15,2))
    - `status` (ENUM: 'PENDENTE', 'PARCIAL', 'PAGO')
  - `baixas_financeiras`:
    - `id` (UUID/PK)
    - `parcela_id` (UUID/FK)
    - `data_baixa` (DATE)
    - `valor_pago` (DECIMAL(15,2))
    - `forma_pagamento` (VARCHAR)
    - `observacao` (VARCHAR)
- **Endpoints:**
  - `GET /api/financeiro/titulos`: listagem com filtros (tipo, status, datas) e resumo de saldos.
  - `POST /api/financeiro/titulos`: cadastro de título com geração de parcelas.
  - `GET /api/financeiro/titulos/:id`: detalhes do título e suas parcelas.
  - `POST /api/financeiro/parcelas/:id/baixa`: registro de baixa total ou parcial.
- **Interface:**
  - Painel com KPI Cards: Total a Pagar, Total a Receber, Saldo em Aberto, Pagos no Mês.
  - Tabela com filtros interativos, badges de status coloridos (`PAGO` verde, `PARCIAL` amarelo, `PENDENTE` azul).
  - Modal de liquidação/baixa com indicação de saldo restante e campo para valor a baixar.

## 7. Tarefas de implementação
- [x] Elaborar especificação técnica detalhada (`specs/item-2-contabilidade/SPEC-2.3.md`)
- [x] Implementar modelos e repositórios de Títulos, Parcelas e Baixas
- [x] Implementar serviço financeiro com recálculo de saldos e transações
- [x] Implementar endpoints da API REST financeira
- [x] Desenvolver interface visual com painel financeiro responsivo
- [x] Criar suíte de testes automatizados para os critérios CA-1 a CA-6
- [x] Registrar evidências de validação e atualizar CHANGELOG.md

## 8. Dependências
- Módulo independente, integrável no dashboard administrativo.

## 9. Como validar
1. **Cadastro e parcelamento (CA-1):**
   - Criar conta a pagar de R$ 1.500 em 3x. Conferir 3 parcelas de R$ 500 geradas.
2. **Baixa parcial (CA-2, CA-5):**
   - Baixar R$ 200 na parcela 1. Conferir saldo restante R$ 300 e status `PARCIAL`.
   - Tentar baixar R$ 400 e validar recusa por exceder saldo.
3. **Baixa total e quitação do título (CA-3, CA-4):**
   - Baixar os R$ 300 restantes. Conferir parcela como `PAGO`.
   - Quitar as demais parcelas e conferir título como `PAGO`.
4. **Painel e listagem (CA-6):**
   - Conferir filtros e totalizadores no painel.

## 10. Evidências (preencher ao concluir)
- **CA-1 (Cadastro e Parcelas):** Teste automatizado aprovado (`ok 12 - SPEC-2.3: CA-1 - Cadastro de conta a pagar com parcelamento automático` - gera parcelas com vencimentos e saldos corretos).
- **CA-2 (Baixa Parcial):** Teste automatizado aprovado (`ok 13 - SPEC-2.3: CA-2 - Baixa parcial atualiza saldo pendente e marca parcela como PARCIAL`).
- **CA-5 (Bloqueio de Baixa Excessiva):** Teste automatizado aprovado (`ok 14 - SPEC-2.3: CA-5 - Rejeição de baixa com valor superior ao saldo pendente`).
- **CA-3 (Baixa Total):** Teste automatizado aprovado (`ok 15 - SPEC-2.3: CA-3 - Baixa total liquida a parcela e zera saldo pendente`).
- **CA-4 (Quitação Consolidada):** Teste automatizado aprovado (`ok 16 - SPEC-2.3: CA-4 - Quitação de todas as parcelas atualiza o status do título para PAGO`).
- **CA-6 (Painel Financeiro e Indicadores):** Teste automatizado aprovado (`ok 17 - SPEC-2.3: CA-6 - Painel e consulta de títulos financeiros com saldos consolidados`).
- **Resumo de Execução dos Testes:** 6/6 testes passaram em 356ms. Total integrado das 3 specs: 17/17 aprovados. Status: 100% OK.

## 11. Histórico de revisão
*Nenhuma ressalva registrada até o momento.*
