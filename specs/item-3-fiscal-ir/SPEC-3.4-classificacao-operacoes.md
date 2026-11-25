# SPEC-3.4 – Classificação das operações

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/8ivyVM6H | Feito |

## 1. Contexto e objetivo
Esta especificação define a **classificação fiscal das operações** por **natureza da operação, CFOP/códigos aplicáveis, NCM e CST/CSOSN**, conforme o tipo de operação e o regime tributário da empresa, utilizando **tabelas fictícias configuráveis** (sem caráter de tabela fiscal oficial).

## 2. Requisitos relacionados
- **RF-019:** Classificar operações por natureza, CFOP/códigos aplicáveis, NCM, CST/CSOSN ou classificações vigentes, conforme operação e regime.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de regras/tabelas fictícias de classificação por empresa contendo: `regime` (`SIMPLES_NACIONAL`, `LUCRO_PRESUMIDO`, `LUCRO_REAL`), `tipoOperacao` (`ENTRADA`, `SAIDA`, `SERVICO`), `natureza`, prefixo/código `ncm`, `cfop` e `cstCsosn`.
  - Classificação de operação fiscal informando `regime`, `tipoOperacao`, `natureza` e `ncm`, retornando e persistindo a classificação aplicada (`natureza`, `cfop`, `ncm`, `cstCsosn`, `regime` e aviso explícito de tabela fictícia).
  - Listagem das classificações realizadas para a empresa.
- **Fora do escopo:**
  - Tabelas tributárias oficiais da Receita Federal/SEFAZ/TIPI ou atualização automática por legislação.
  - Cálculo de alíquotas e apuração de impostos ou emissão de documentos fiscais.

## 4. Comportamento esperado
- **Fluxo normal:**
  - A empresa possui regras fictícias configuradas (ou utiliza o catálogo fictício padrão) associando regime, tipo de operação, natureza e NCM ao respectivo CFOP e CST/CSOSN.
  - Ao submeter uma operação para classificação, o sistema encontra a regra compatível, registra a classificação da operação e retorna `natureza`, `cfop`, `ncm`, `cstCsosn` e `regime`.
- **Fluxo de erro/exceção:**
  - Se faltarem `empresaId`, `regime`, `tipoOperacao`, `natureza` ou `ncm` (formato 8 dígitos), o sistema recusa a operação (HTTP 400).
  - Se não existir regra compatível para a combinação informada (regime, tipoOperacao, natureza/NCM), o sistema recusa a classificação informando o motivo.

## 5. Critérios de aceite
- **CA-1 (Classificação por natureza, CFOP, NCM e CST/CSOSN):** Dada uma empresa com regras/tabelas fictícias configuradas, quando uma operação for submetida com `regime`, `tipoOperacao`, `natureza` e `ncm` válidos, então o sistema deve classificar e persistir a operação retornando `natureza`, `cfop`, `ncm` e `cstCsosn` compatíveis (RF-019).
- **CA-2 (Diferenciação conforme regime tributário):** Dadas regras configuradas para regimes distintos (`SIMPLES_NACIONAL` com CSOSN e `LUCRO_PRESUMIDO`/`LUCRO_REAL` com CST), quando a mesma operação for classificada sob cada regime, então o sistema deve aplicar o `cstCsosn` correspondente ao regime informado (RF-019).
- **CA-3 (Consulta de classificações registradas):** Dadas operações já classificadas para a empresa, quando for solicitada a listagem, então o sistema deve retornar todas as classificações persistidas com seus códigos completos (RF-019).
- **CA-4 (Validação de entrada e ausência de regra compatível):** Dada a tentativa de classificar operação ou cadastrar regra, quando houver parâmetros inválidos (NCM inválido, regime inválido, natureza ausente) ou inexistência de regra compatível, então o sistema deve recusar a operação (RF-019).

## 6. Plano técnico
- **Modelos (`src/models/ClassificacaoOperacaoModel.ts`):** Tipos para `RegimeTributario`, `RegraClassificacaoOperacao` e `ClassificacaoOperacao`.
- **Repositório (`src/repositories/ClassificacaoOperacaoRepository.ts`):** Interface `IClassificacaoOperacaoRepository` e `InMemoryClassificacaoOperacaoRepository`.
- **Serviço (`src/services/ClassificacaoOperacaoService.ts`):** Cadastro de regras fictícias por empresa, motor de classificação por regime/operação/natureza/NCM e listagem de classificações.
- **Controller e Rotas (`src/controllers/ClassificacaoOperacaoController.ts` e `src/routes/classificacaoOperacaoRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/classificacao/regras`
  - `GET /api/empresas/:empresaId/fiscal/classificacao/regras`
  - `POST /api/empresas/:empresaId/fiscal/classificar`
  - `GET /api/empresas/:empresaId/fiscal/classificacoes`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/classificacaoOperacoes.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/ClassificacaoOperacaoModel.ts`.
- [x] Criar repositório em `src/repositories/ClassificacaoOperacaoRepository.ts`.
- [x] Implementar `ClassificacaoOperacaoService` em `src/services/ClassificacaoOperacaoService.ts`.
- [x] Implementar `ClassificacaoOperacaoController` e `classificacaoOperacaoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/classificacaoOperacoes.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Módulo base Express/TypeScript e estrutura multi-tenant por `empresaId`.

## 9. Como validar
1. Executar `npx jest tests/classificacaoOperacoes.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/40
- Modelos, repositório, serviço, controller e rotas em `src/models/ClassificacaoOperacaoModel.ts`, `src/repositories/ClassificacaoOperacaoRepository.ts`, `src/services/ClassificacaoOperacaoService.ts`, `src/controllers/ClassificacaoOperacaoController.ts` e `src/routes/classificacaoOperacaoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/classificacaoOperacoes.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
