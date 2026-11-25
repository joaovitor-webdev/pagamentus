# SPEC-5.11 – Testes de integração e recuperação

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 5 – Experiência, relatórios, integrações e testes | @5g8p6bzzxf-crypto | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **suíte de testes de integração entre módulos e testes de recuperação/continuidade**, garantindo que fluxos encadeados entre diferentes subsistemas funcionem de forma integrada e que o sistema mantenha estabilidade e capacidade de recuperação após falhas ou restauração de estado.

## 2. Requisitos relacionados
- Oriundo do planejamento do projeto (validação de integração entre módulos e testes de recuperação/continuidade).

## 3. Escopo
- **Dentro do escopo:**
  - Teste de integração encadeada entre módulos de Imposto de Renda (`SPEC-3.13` Ficha → `SPEC-3.14` Rendimentos/Deduções → `SPEC-3.17` Consistência → `SPEC-3.19` Status/Pendências).
  - Teste de integração encadeada entre módulos de Obrigações e Alertas (`SPEC-4.7` Tarefas → `SPEC-4.8` Alertas).
  - Teste de recuperação e continuidade validando execução de rotina de backup/restauração do módulo de plataforma (`BackupRecuperacaoService` / `SPEC-1.12`) e continuidade da API após requisições inválidas.
- **Fora do escopo:**
  - Simulação de queda física de datacenter ou failover de cluster Kubernetes.

## 4. Comportamento esperado
- **Fluxo normal:**
  - Ao executar `npx jest tests/spec511-integracaoRecuperacao.test.ts`, todos os fluxos integrados e cenários de recuperação passam com sucesso.
- **Fluxo de erro/exceção:**
  - Requisições com payloads malformados retornam erro controlado (`HTTP 400`) sem comprometer requisições subsequentes.

## 5. Critérios de aceite
- **CA-1 (Integração entre módulos de IRPF):** Dado um fluxo encadeado criando ficha, registrando rendimentos/deduções, executando conferência de consistência e atualizando status, então todas as etapas devem integrar-se sem erros.
- **CA-2 (Integração entre módulos de Obrigações e Alertas):** Dadas tarefas criadas no módulo de obrigações, quando seus prazos forem submetidos ao processador de alertas, então os alertas devem ser emitidos com registro de entrega.
- **CA-3 (Recuperação e continuidade):** Dada uma falha de entrada inválida ou simulação de backup/recuperação de dados, então o sistema deve manter a API operante e concluir o fluxo de backup/restauração sem perda de integridade.

## 6. Plano técnico
- **Testes (`tests/spec511-integracaoRecuperacao.test.ts`):** Testes de integração e recuperação com Jest + Supertest sobre `criarApp()`.

## 7. Tarefas de implementação
- [x] Criar suíte de testes de integração e recuperação em `tests/spec511-integracaoRecuperacao.test.ts`.
- [x] Executar `npx jest tests/spec511-integracaoRecuperacao.test.ts` e `npm run build` e registrar evidências na spec.

## 8. Dependências
- `SPEC-1.12`, `SPEC-3.13`, `SPEC-3.14`, `SPEC-3.17`, `SPEC-3.19`, `SPEC-4.7`, `SPEC-4.8`.

## 9. Como validar
1. Executar `npx jest tests/spec511-integracaoRecuperacao.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Suíte `tests/spec511-integracaoRecuperacao.test.ts` executada com `npx jest tests/spec511-integracaoRecuperacao.test.ts` (1 suíte, 3 testes aprovados: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
