# SPEC-3.17 – Consistência e regras do exercício

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **motor de conferência de consistência da declaração de IRPF parametrizado por exercício fiscal**, verificando coerência entre rendimentos, imposto retido, bens, dívidas, evolução patrimonial e informações de dependentes, sem inventar limites fixos no código (todos os limites/regras são parametrizados por exercício).

## 2. Requisitos relacionados
- **RF-036:** Conferir consistência entre rendimentos, imposto retido, bens, dívidas, evolução patrimonial e informações de dependentes.
- **RF-041:** Não inventar campos, deduções, limites ou regras; atualizar o sistema por exercício fiscal e validar com orientações oficiais vigentes.

## 3. Escopo
- **Dentro do escopo:**
  - Parametrização de regras/limites por exercício fiscal (`exercicio`, `limiteDeducaoEducacaoPorPessoa`, `deducaoPorDependente`, `versaoOrientacao`, `avisoParametrizacao`).
  - Execução de conferência de consistência da declaração verificando:
    1. Existência de regra parametrizada para o exercício (bloqueio se não houver regra cadastrada para o exercício, cumprindo `RF-041`),
    2. Imposto retido maior que o rendimento tributável declarado,
    3. Evolução patrimonial descoberta (aumento líquido de bens superior aos rendimentos + variação de dívidas),
    4. Dedução de educação acima do limite parametrizado para o exercício, e
    5. Dependentes sem documento identificador informado.
- **Fora do escopo:**
  - Limites oficiais fixos da Receita Federal hardcoded no código.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cadastra os parâmetros/regras do exercício fiscal.
  - Ao executar a conferência de consistência de uma declaração para aquele exercício, o sistema retorna `consistente: true/false`, a lista de inconsistências encontradas e a versão da regra do exercício utilizada.
- **Fluxo de erro/exceção:**
  - Se não houver regra parametrizada para o exercício consultado, o sistema recusa a conferência (HTTP 404) informando que as regras do exercício precisam ser cadastradas (`RF-041`).
  - Se parâmetros obrigatórios forem inválidos ou negativos, retorna HTTP 400.

## 5. Critérios de aceite
- **CA-1 (Parametrização por exercício sem limites hardcoded):** Dado um exercício fiscal, quando suas regras/limites forem parametrizados, então a conferência deve utilizar exclusivamente os parâmetros daquele exercício e recusar (HTTP 404) exercícios sem parametrização (`RF-041`).
- **CA-2 (Detecção de inconsistências):** Dada uma declaração com IR retido superior aos rendimentos, evolução patrimonial descoberta, dedução de educação acima do limite parametrizado ou dependente sem documento, quando a conferência for executada, então o sistema deve retornar `consistente: false` listando todas as inconsistências detectadas (`RF-036`).
- **CA-3 (Declaração consistente):** Dada uma declaração coerente dentro dos limites parametrizados para o exercício, quando a conferência for executada, então o sistema deve retornar `consistente: true` e lista vazia de inconsistências (`RF-036`, `RF-041`).

## 6. Plano técnico
- **Modelos (`src/models/ConsistenciaIrModel.ts`):** `ParametrosExercicioIr`, `InconsistenciaIr`, `EntradaConsistenciaIr` e `ResultadoConsistenciaIr`.
- **Serviço (`src/services/ConsistenciaIrService.ts`):** Cadastro de parâmetros por exercício e motor de conferência de consistência.
- **Controller e Rotas (`src/controllers/ConsistenciaIrController.ts` e `src/routes/consistenciaIrRoutes.ts`):**
  - `POST /api/ir/regras-exercicio`
  - `POST /api/ir/fichas/:fichaId/consistencia`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/consistenciaRegrasExercicioIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/ConsistenciaIrModel.ts`.
- [x] Implementar `ConsistenciaIrService` em `src/services/ConsistenciaIrService.ts`.
- [x] Implementar `ConsistenciaIrController` e `consistenciaIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/consistenciaRegrasExercicioIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13`, `SPEC-3.14` e `SPEC-3.15`.

## 9. Como validar
1. Executar `npx jest tests/consistenciaRegrasExercicioIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/ConsistenciaIrModel.ts`, `src/services/ConsistenciaIrService.ts`, `src/controllers/ConsistenciaIrController.ts` e `src/routes/consistenciaIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/consistenciaRegrasExercicioIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
