# SPEC-3.5 – Regras tributárias versionadas

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/dWBjUREh | Feito |

## 1. Contexto e objetivo
Esta especificação define a **parametrização e versionamento controlado de regras tributárias** (tabelas, fórmulas e leiautes) por **exercício fiscal, vigência, regime, jurisdição e situação do contribuinte**, garantindo que os cálculos utilizem a versão correta da regra para cada cenário (com dados parametrizados de demonstração, sem caráter de tabela oficial).

## 2. Requisitos relacionados
- **RF-080:** Permitir parametrização por exercício fiscal e atualização controlada de tabelas, fórmulas e leiautes.
- **RB-004:** Cálculos fiscais e de IR devem usar regras específicas do exercício, regime, jurisdição e situação do contribuinte.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro e atualização controlada (versionada) de regras tributárias por empresa, contendo: `codigoRegra`, `exercicio` (ano fiscal), `vigenciaInicio` e `vigenciaFim` (`YYYY-MM-DD`), `regime`, `jurisdicao`, `situacaoContribuinte`, `aliquotaPercentual` / `parcelaDeduzir` (fórmula), `leiauteVersao` e `versao` incremental.
  - Preservação do histórico de versões anteriores ao atualizar uma regra.
  - Execução de cálculo fiscal sobre uma base de cálculo selecionando automaticamente a versão mais recente vigente para a combinação (`exercicio`, `dataCalculo`, `regime`, `jurisdicao`, `situacaoContribuinte`).
- **Fora do escopo:**
  - Tabelas oficiais pré-carregadas da Receita Federal ou SEFAZ.
  - Emissão de guias de pagamento (DARF/DAS/GNRE) ou arquivos SPED completos.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cadastra uma regra tributária para um exercício e vigência específicos; o sistema grava como `versao: 1`.
  - Ao atualizar a regra (ex.: nova tabela/fórmula/leiaute), o sistema cria `versao: 2` mantendo a `versao: 1` no histórico.
  - Ao solicitar um cálculo informando exercício, data, regime, jurisdição, situação do contribuinte e base de cálculo, o sistema localiza a regra vigente correspondente e retorna o valor calculado, a versão utilizada e aviso de regra parametrizada.
- **Fluxo de erro/exceção:**
  - Se `vigenciaInicio > vigenciaFim`, exercício inválido, alíquota negativa ou campos obrigatórios ausentes, o sistema recusa o cadastro/atualização (HTTP 400).
  - Se não existir regra vigente para o exercício, data, regime, jurisdição e situação informados no cálculo, o sistema recusa o cálculo informando o motivo.

## 5. Critérios de aceite
- **CA-1 (Parametrização e atualização controlada por exercício e vigência):** Dada uma empresa existente, quando uma regra tributária for cadastrada e posteriormente atualizada para um exercício fiscal com vigência, fórmula e leiaute, então cada atualização deve gerar uma nova versão incremental preservando o histórico anterior (RF-080).
- **CA-2 (Cálculo usa a regra do exercício e vigência corretos):** Dadas regras cadastradas para exercícios ou vigências distintas, quando um cálculo for executado informando determinado exercício e data dentro da vigência, então o sistema deve aplicar exatamente a regra daquele exercício/vigência (RF-080, RB-004).
- **CA-3 (Aplicação por regime, jurisdição e situação do contribuinte):** Dadas regras distintas por regime, jurisdição ou situação do contribuinte no mesmo exercício, quando o cálculo for solicitado para cada combinação, então o sistema deve aplicar a regra correspondente àquela combinação (RB-004).
- **CA-4 (Validações e bloqueios):** Dado o cadastro de regra ou solicitação de cálculo, quando `vigenciaInicio > vigenciaFim`, parâmetros obrigatórios estiverem ausentes/inválidos ou não houver regra vigente compatível, então o sistema deve recusar a operação (RF-080, RB-004).

## 6. Plano técnico
- **Modelos (`src/models/RegraTributariaVersionadaModel.ts`):** Tipos para `RegraTributariaVersionada`, `SituacaoContribuinte` e `ResultadoCalculoTributario`.
- **Repositório (`src/repositories/RegraTributariaVersionadaRepository.ts`):** Interface `IRegraTributariaVersionadaRepository` e `InMemoryRegraTributariaVersionadaRepository`.
- **Serviço (`src/services/RegraTributariaVersionadaService.ts`):** Criação/atualização versionada, consulta de histórico e cálculo por exercício, vigência, regime, jurisdição e situação do contribuinte.
- **Controller e Rotas (`src/controllers/RegraTributariaVersionadaController.ts` e `src/routes/regraTributariaVersionadaRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/regras-versionadas`
  - `PUT /api/empresas/:empresaId/fiscal/regras-versionadas/:codigoRegra`
  - `GET /api/empresas/:empresaId/fiscal/regras-versionadas`
  - `POST /api/empresas/:empresaId/fiscal/regras-versionadas/calcular`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/regrasTributariasVersionadas.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RegraTributariaVersionadaModel.ts`.
- [x] Criar repositório em `src/repositories/RegraTributariaVersionadaRepository.ts`.
- [x] Implementar `RegraTributariaVersionadaService` em `src/services/RegraTributariaVersionadaService.ts`.
- [x] Implementar `RegraTributariaVersionadaController` e `regraTributariaVersionadaRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/regrasTributariasVersionadas.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.4` (reaproveitamento do tipo `RegimeTributario`).

## 9. Como validar
1. Executar `npx jest tests/regrasTributariasVersionadas.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, repositório, serviço, controller e rotas em `src/models/RegraTributariaVersionadaModel.ts`, `src/repositories/RegraTributariaVersionadaRepository.ts`, `src/services/RegraTributariaVersionadaService.ts`, `src/controllers/RegraTributariaVersionadaController.ts` e `src/routes/regraTributariaVersionadaRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/regrasTributariasVersionadas.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/41

## 11. Histórico de revisão
- Ainda sem revisões registradas.
