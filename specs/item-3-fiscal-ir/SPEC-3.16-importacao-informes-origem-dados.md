# SPEC-3.16 – Importação de informes e origem dos dados

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **importação de informes de rendimentos/documentos de IR por arquivo compatível (JSON/CSV) ou digitação assistida**, registrando o exercício fiscal e distinguindo explicitamente a **origem de cada dado** (`INFORMADO_CLIENTE`, `IMPORTADO`, `CALCULADO_SISTEMA` ou `REVISADO_PROFISSIONAL`).

## 2. Requisitos relacionados
- **RF-035:** Importar dados de informes e documentos por arquivos compatíveis ou digitação assistida; registrar origem e exercício.
- **RB-005:** O sistema deve distinguir dados informados pelo cliente, dados importados, cálculos do sistema e dados revisados pelo profissional.

## 3. Escopo
- **Dentro do escopo:**
  - Registro de informes de rendimentos via **importação de arquivo compatível** (`JSON` ou `CSV` em texto) ou via **digitação assistida**, armazenando exercício, fonte pagadora, valores, conteúdo original (quando importado) e `origemDado` (`INFORMADO_CLIENTE`, `IMPORTADO`, `CALCULADO_SISTEMA`, `REVISADO_PROFISSIONAL`).
  - Marcação/revisão profissional de um registro existente, atualizando sua origem para `REVISADO_PROFISSIONAL` preservando a origem inicial.
  - Consulta de informes por declaração (`fichaId`), com filtro opcional por `origemDado` e `exercicio`.
- **Fora do escopo:**
  - OCR de PDFs escaneados ou conexão direta com o e-CAC / Receita Federal.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário importa um informe (formato `CSV` ou `JSON`) informando `exercicio`; o sistema interpreta os itens, preserva o conteúdo original e grava cada item com `origemDado: 'IMPORTADO'`.
  - O usuário também pode registrar dados via digitação assistida informando `origemDado` (`INFORMADO_CLIENTE`, `CALCULADO_SISTEMA` ou `REVISADO_PROFISSIONAL`) e `exercicio`.
  - Ao consultar a declaração, é possível filtrar e distinguir claramente a origem de cada registro.
- **Fluxo de erro/exceção:**
  - Se o formato do arquivo não for compatível, o conteúdo for inválido, `exercicio` for inválido ou `origemDado` não pertencer aos tipos permitidos, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Importação de informes por arquivo compatível com origem e exercício):** Dada uma declaração (`fichaId`), quando um informe em formato `CSV` ou `JSON` for importado para determinado exercício, então o sistema deve extrair os registros, preservar o conteúdo original e gravar `origemDado: 'IMPORTADO'` e `exercicio` (`RF-035`, `RB-005`).
- **CA-2 (Digitação assistida e distinção de origens):** Dada uma declaração (`fichaId`), quando registros forem incluídos por digitação assistida ou revisados por profissional, então o sistema deve distinguir `INFORMADO_CLIENTE`, `IMPORTADO`, `CALCULADO_SISTEMA` e `REVISADO_PROFISSIONAL` nas consultas e filtros (`RF-035`, `RB-005`).
- **CA-3 (Validações de formato e entrada):** Dados formato incompatível, conteúdo malformado, exercício inválido ou origem inválida, quando a operação for solicitada, então o sistema deve recusar com HTTP 400 (`RF-035`, `RB-005`).

## 6. Plano técnico
- **Modelos (`src/models/InformeOrigemIrModel.ts`):** `OrigemDadoIr`, `FormatoInformeIr` e `RegistroInformeIr`.
- **Serviço (`src/services/InformeOrigemIrService.ts`):** Importação `CSV`/`JSON`, digitação assistida, marcação de revisão profissional e listagem com filtros.
- **Controller e Rotas (`src/controllers/InformeOrigemIrController.ts` e `src/routes/informeOrigemIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/informes/importar`
  - `POST /api/ir/fichas/:fichaId/informes`
  - `PATCH /api/ir/fichas/:fichaId/informes/:informeId/revisar`
  - `GET /api/ir/fichas/:fichaId/informes`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/importacaoInformesOrigemIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/InformeOrigemIrModel.ts`.
- [x] Implementar `InformeOrigemIrService` em `src/services/InformeOrigemIrService.ts`.
- [x] Implementar `InformeOrigemIrController` e `informeOrigemIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/importacaoInformesOrigemIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13` (referência a `fichaId`).

## 9. Como validar
1. Executar `npx jest tests/importacaoInformesOrigemIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/InformeOrigemIrModel.ts`, `src/services/InformeOrigemIrService.ts`, `src/controllers/InformeOrigemIrController.ts` e `src/routes/informeOrigemIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/importacaoInformesOrigemIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
