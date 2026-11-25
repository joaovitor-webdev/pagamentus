# SPEC-3.6 – Regimes tributários

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/NLkJOXmL | Feito |

## 1. Contexto e objetivo
Esta especificação define a **parametrização de regimes tributários e o controle de histórico de opção com vigência temporal** por empresa, contemplando Simples Nacional, Lucro Presumido, Lucro Real e outros enquadramentos aplicáveis, bem como anexos/faixas, atividades, segregação de receitas e parâmetros associados.

## 2. Requisitos relacionados
- **RF-025:** Suportar parametrização para Simples Nacional, Lucro Presumido, Lucro Real e outros enquadramentos aplicáveis, conforme escopo contratado.
- **RF-026:** Manter histórico de opção, anexos/faixas, atividades, segregação de receitas e parâmetros com vigência temporal.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de parametrização de regime tributário por empresa (`SIMPLES_NACIONAL`, `LUCRO_PRESUMIDO`, `LUCRO_REAL` e outros enquadramentos aplicáveis, ex.: `MEI`, `ISENTO_IMUNE`, `OUTRO`).
  - Registro de vigência temporal (`vigenciaInicio`, `vigenciaFim` no formato `YYYY-MM-DD`), anexos/faixas, atividades (ex.: códigos/descrições de atividade), segregação de receitas (percentuais ou categorias de receita) e parâmetros adicionais da opção.
  - Manutenção do histórico completo de opções por empresa ao registrar novas opções/alterações em novas vigências, com consulta do histórico e da opção vigente em determinada data.
- **Fora do escopo:**
  - Cálculo automático completo de PGDAS-D, DCTF, ECF ou apuração oficial de impostos.
  - Integração direta com o portal do Simples Nacional ou Receita Federal para consulta automática de opção.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário parametriza o regime tributário inicial de uma empresa informando regime/enquadramento, vigência temporal, anexo/faixa (quando aplicável), atividades, segregação de receitas e parâmetros.
  - Quando a empresa muda de regime, anexo/faixa, atividade ou parâmetros em um novo período, uma nova entrada de opção é registrada com sua respectiva vigência, mantendo as opções anteriores no histórico.
  - Ao consultar o regime da empresa, é possível listar todo o histórico de opções ou consultar qual opção está vigente em uma data de referência.
- **Fluxo de erro/exceção:**
  - Se o enquadramento/regime for inválido, faltarem campos obrigatórios, a vigência tiver formato inválido ou `vigenciaInicio > vigenciaFim`, o sistema recusa a operação (HTTP 400).
  - Se não houver opção vigente para a data consultada, o sistema informa explicitamente a ausência de enquadramento vigente (HTTP 404).

## 5. Critérios de aceite
- **CA-1 (Parametrização de regime, anexo/faixa, atividades e segregação):** Dada uma empresa existente, quando for cadastrada uma parametrização de regime tributário (`SIMPLES_NACIONAL`, `LUCRO_PRESUMIDO`, `LUCRO_REAL` ou outro enquadramento aplicável) com anexo ou faixa, atividades, segregação de receitas, parâmetros e vigência temporal, então o sistema deve registrar a opção vinculada à empresa (`RF-025`, `RF-026`).
- **CA-2 (Histórico de opção por vigência temporal):** Dada uma empresa com opção de regime registrada em uma vigência, quando uma nova opção ou atualização de anexo/faixa, atividade ou parâmetros for registrada para outra vigência, então o sistema deve preservar todas as opções anteriores no histórico e retornar corretamente a opção vigente para uma data consultada (`RF-026`).
- **CA-3 (Validações de enquadramento e vigência):** Dado um cadastro de opção de regime tributário ou consulta por data, quando o regime/enquadramento for inválido, `vigenciaInicio > vigenciaFim`, formato de data inválido ou não existir opção vigente na data consultada, então o sistema deve recusar a operação com mensagem explicativa (`RF-025`, `RF-026`).

## 6. Plano técnico
- **Modelos (`src/models/RegimeTributarioEmpresaModel.ts`):** Definição de `EnquadramentoTributario`, `SegregacaoReceita`, `OpcaoRegimeTributario` e DTOs de entrada.
- **Repositório (`src/repositories/RegimeTributarioEmpresaRepository.ts`):** Interface `IRegimeTributarioEmpresaRepository` e implementação `InMemoryRegimeTributarioEmpresaRepository` para armazenar e consultar o histórico de opções por empresa.
- **Serviço (`src/services/RegimeTributarioEmpresaService.ts`):** Validações de enquadramento e vigência temporal, registro preservando histórico e consulta de histórico/vigente por data.
- **Controller e Rotas (`src/controllers/RegimeTributarioEmpresaController.ts` e `src/routes/regimeTributarioEmpresaRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/regimes` — Registrar opção de regime tributário com vigência.
  - `GET /api/empresas/:empresaId/fiscal/regimes` — Listar histórico de opções de regime da empresa.
  - `GET /api/empresas/:empresaId/fiscal/regimes/vigente?data=YYYY-MM-DD` — Consultar opção vigente na data informada.
- **Integração (`src/app.ts`):** Registrar repositório, serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/regimesTributarios.test.ts`):** Testes de integração com `supertest` cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RegimeTributarioEmpresaModel.ts`.
- [x] Criar repositório em `src/repositories/RegimeTributarioEmpresaRepository.ts`.
- [x] Implementar `RegimeTributarioEmpresaService` em `src/services/RegimeTributarioEmpresaService.ts`.
- [x] Implementar `RegimeTributarioEmpresaController` e `regimeTributarioEmpresaRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/regimesTributarios.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência obrigatória bloqueante (reaproveita padrão de API REST em `src/app.ts`).

## 9. Como validar
1. Executar `npx jest tests/regimesTributarios.test.ts` e confirmar aprovação de todos os cenários (`CA-1` a `CA-3`).
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, repositório, serviço, controller e rotas em `src/models/RegimeTributarioEmpresaModel.ts`, `src/repositories/RegimeTributarioEmpresaRepository.ts`, `src/services/RegimeTributarioEmpresaService.ts`, `src/controllers/RegimeTributarioEmpresaController.ts` e `src/routes/regimeTributarioEmpresaRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/regimesTributarios.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/42

## 11. Histórico de revisão
- Ainda sem revisões registradas.
