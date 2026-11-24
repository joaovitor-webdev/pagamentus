# SPEC-3.10 – Divergências fiscais e contábeis

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **mecanismo de conferência e alerta de divergências entre documentos fiscais, apuração tributária e lançamentos contábeis** por empresa e competência, permitindo identificar rapidamente diferenças de valores ou registros ausentes entre as três visões.

## 2. Requisitos relacionados
- **RF-024:** Alertar sobre divergências entre documentos fiscais, apuração e contabilidade.

## 3. Escopo
- **Dentro do escopo:**
  - Conciliação/verificação de divergências por empresa e competência (`YYYY-MM`) comparando:
    1. Total de **documentos fiscais** (notas/documentos da competência),
    2. Total da **apuração tributária** (base/tributos apurados na competência), e
    3. Total de **lançamentos contábeis** (valores contabilizados na competência).
  - Geração de alertas estruturados indicando o tipo da divergência (`DOCUMENTO_X_APURACAO`, `APURACAO_X_CONTABILIDADE`, `DOCUMENTO_X_CONTABILIDADE`), valores comparados, diferença apurada e severidade (`ALTA` ou `MEDIA`).
  - Tolerância opcional de arredondamento (padrão `0.00`) e retorno limpo (`possuiDivergencias: false`, lista vazia de alertas) quando os totais estiverem conciliados.
  - Histórico das verificações realizadas por empresa.
- **Fora do escopo:**
  - Retificação automática de notas fiscais, apurações ou lançamentos contábeis.
  - Integração direta com SPED Fiscal/ECD/ECF.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário envia os totais/itens de documentos fiscais, apuração tributária e contabilidade para uma empresa e competência.
  - Se houver diferença acima da tolerância entre quaisquer pares das três visões, o sistema gera alertas detalhados com tipo, valores comparados e diferença.
  - Se todos os valores estiverem conciliados dentro da tolerância, o sistema retorna `possuiDivergencias: false` sem alertas.
- **Fluxo de erro/exceção:**
  - Se `empresaId` estiver ausente, `competencia` não seguir `YYYY-MM`, algum valor for inválido/negativo ou a tolerância for negativa, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Detecção de divergência entre documentos fiscais, apuração e contabilidade):** Dada uma empresa e competência com valores divergentes entre documentos fiscais, apuração tributária e/ou contabilidade, quando a conferência for executada, então o sistema deve retornar `possuiDivergencias: true` e emitir alertas discriminando cada par divergente e a diferença exata (`RF-024`).
- **CA-2 (Cenário conciliado sem alertas):** Dada uma empresa e competência cujos totais de documentos fiscais, apuração e contabilidade sejam compatíveis dentro da tolerância informada, quando a conferência for executada, então o sistema deve retornar `possuiDivergencias: false` e lista de alertas vazia (`RF-024`).
- **CA-3 (Histórico de conferências e validações):** Dada uma conferência executada, quando o histórico da empresa for consultado, então o sistema deve listar as verificações registradas; e quando parâmetros obrigatórios forem inválidos (competência malformada ou valores negativos), deve recusar com HTTP 400 (`RF-024`).

## 6. Plano técnico
- **Modelos (`src/models/DivergenciaFiscalContabilModel.ts`):** `TipoDivergenciaFiscal`, `AlertaDivergenciaFiscal`, `EntradaConferenciaDivergencia` e `ResultadoConferenciaDivergencia`.
- **Serviço (`src/services/DivergenciaFiscalContabilService.ts`):** Validações, comparação dos três totais com tolerância e armazenamento em memória do histórico por empresa.
- **Controller e Rotas (`src/controllers/DivergenciaFiscalContabilController.ts` e `src/routes/divergenciaFiscalContabilRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/divergencias/conferir`
  - `GET /api/empresas/:empresaId/fiscal/divergencias`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/divergenciasFiscaisContabeis.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/DivergenciaFiscalContabilModel.ts`.
- [x] Implementar `DivergenciaFiscalContabilService` em `src/services/DivergenciaFiscalContabilService.ts`.
- [x] Implementar `DivergenciaFiscalContabilController` e `divergenciaFiscalContabilRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/divergenciasFiscaisContabeis.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/divergenciasFiscaisContabeis.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/DivergenciaFiscalContabilModel.ts`, `src/services/DivergenciaFiscalContabilService.ts`, `src/controllers/DivergenciaFiscalContabilController.ts` e `src/routes/divergenciaFiscalContabilRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/divergenciasFiscaisContabeis.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/57

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
