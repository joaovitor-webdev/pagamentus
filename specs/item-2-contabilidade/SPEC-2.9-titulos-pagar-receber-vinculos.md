# SPEC-2.9 – Títulos a pagar e a receber e vínculos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/TeTxvWKP | Feito |

## 1. Contexto e objetivo
Esta especificação define o cadastro de **títulos a pagar e a receber** com suas **parcelas, vencimentos, fornecedores/clientes, condições de pagamento e categorias**, bem como o registro de **anexos e vínculos** entre cada título, documento fiscal, lançamento contábil e comprovante. O objetivo é garantir rastreabilidade entre o contas a pagar/receber e os registros fiscais e contábeis da empresa.

## 2. Requisitos relacionados
- **RF-046:** Cadastrar títulos, parcelas, fornecedores, clientes, vencimentos, condições de pagamento e categorias.
- **RF-050:** Registrar anexos e vínculo entre título, documento fiscal, lançamento contábil e comprovante.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro e consulta de títulos (`PAGAR` ou `RECEBER`) por empresa, contendo fornecedor/cliente, categoria, condição de pagamento, valor total e parcelas com número, valor e data de vencimento.
  - Registro de anexos e vínculos no título com documento fiscal, lançamento contábil e comprovante.
  - Validação de consistência entre o valor total do título e a soma das parcelas, além da existência do lançamento contábil vinculado na empresa.
- **Fora do escopo:**
  - Baixa/liquidação financeira, cálculo de juros/multas, cobrança bancária ou conciliação bancária.
  - Emissão ou validação fiscal de NF-e/NFS-e em SEFAZ/prefeituras.
  - Armazenamento binário de arquivos em nuvem externa (os anexos e comprovantes são registrados com seus metadados e referência/URI).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cadastra um título a pagar (com fornecedor) ou a receber (com cliente), informando categoria, condição de pagamento, valor total e parcelas com datas de vencimento.
  - Em seguida (ou no próprio cadastro), registra anexos e vincula o título ao documento fiscal, ao lançamento contábil correspondente e ao comprovante.
  - Ao consultar o título ou listar os títulos da empresa, o sistema retorna todos os dados cadastrais, parcelas e vínculos registrados.
- **Fluxo de erro/exceção:**
  - Se faltarem campos obrigatórios (tipo, fornecedor/cliente, categoria, condição de pagamento ou parcelas), o sistema recusa o cadastro (HTTP 400).
  - Se a soma dos valores das parcelas for diferente do valor total do título, ou se houver parcela sem vencimento ou com valor menor ou igual a zero, o sistema recusa a operação.
  - Se for informado um lançamento contábil inexistente ou pertencente a outra empresa no vínculo, o sistema recusa a operação.

## 5. Critérios de aceite
- **CA-1 (Cadastro de título com parcelas e vencimentos):** Dada uma empresa existente, quando for cadastrado um título (`PAGAR` ou `RECEBER`) com fornecedor/cliente, categoria, condição de pagamento e parcelas com vencimento e valores somando o total do título, então o título e suas parcelas devem ser persistidos e listados vinculados à empresa (RF-046).
- **CA-2 (Anexos e vínculo com documento fiscal, lançamento e comprovante):** Dado um título cadastrado para a empresa, quando forem registrados anexos e o vínculo do título com documento fiscal, lançamento contábil existente da empresa e comprovante, então o título deve persistir e retornar esses vínculos e anexos associados (RF-050).
- **CA-3 (Consulta de títulos e vínculos):** Dados títulos cadastrados para a empresa, quando for solicitada a listagem ou consulta por ID, então o sistema deve retornar os dados completos do título, parcelas com vencimentos, categoria, condição de pagamento, fornecedor/cliente, anexos e vínculos (RF-046, RF-050).
- **CA-4 (Validações de entrada e integridade):** Dado o cadastro de título ou registro de vínculo, quando faltarem dados obrigatórios, a soma das parcelas divergir do total do título ou o lançamento contábil vinculado não existir na empresa, então o sistema deve recusar a operação (RF-046, RF-050).

## 6. Plano técnico
- **Modelos (`src/models/TituloFinanceiroModel.ts`):** Interfaces e tipos para `TituloFinanceiro`, `ParcelaTitulo`, `VinculoTitulo` e `AnexoTitulo`.
- **Repositório (`src/repositories/TituloFinanceiroRepository.ts`):** Interface `ITituloFinanceiroRepository` e implementação `InMemoryTituloFinanceiroRepository`.
- **Serviço (`src/services/TituloFinanceiroService.ts`):** Regras de cadastro, validação de parcelas/vencimentos, consulta e registro de anexos e vínculos (integrado a `ILancamentoContabilRepository` para validar o lançamento contábil vinculado).
- **Controller e Rotas (`src/controllers/TituloFinanceiroController.ts` e `src/routes/tituloFinanceiroRoutes.ts`):**
  - `POST /api/empresas/:empresaId/titulos`
  - `GET /api/empresas/:empresaId/titulos`
  - `GET /api/empresas/:empresaId/titulos/:id`
  - `POST /api/empresas/:empresaId/titulos/:id/vinculos`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/titulosPagarReceberVinculos.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/TituloFinanceiroModel.ts`.
- [x] Criar repositório em `src/repositories/TituloFinanceiroRepository.ts`.
- [x] Implementar `TituloFinanceiroService` em `src/services/TituloFinanceiroService.ts`.
- [x] Implementar `TituloFinanceiroController` e `tituloFinanceiroRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/titulosPagarReceberVinculos.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.2` – Lançamentos contábeis (`ILancamentoContabilRepository` para validação de vínculo com lançamento existente).

## 9. Como validar
1. Executar `npx jest tests/titulosPagarReceberVinculos.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/29
- Modelos, repositório, serviço, controller e rotas em `src/models/TituloFinanceiroModel.ts`, `src/repositories/TituloFinanceiroRepository.ts`, `src/services/TituloFinanceiroService.ts`, `src/controllers/TituloFinanceiroController.ts` e `src/routes/tituloFinanceiroRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/titulosPagarReceberVinculos.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
