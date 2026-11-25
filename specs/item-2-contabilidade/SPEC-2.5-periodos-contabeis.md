# SPEC-2.5 – Períodos contábeis

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @italograu17-ai | @joaovitor-webdev | https://trello.com/c/uuh6dMbI | Feito |

## 1. Contexto e objetivo
Estabelecer o controle de ciclo de vida dos períodos contábeis por empresa (`ABERTO`, `EM_FECHAMENTO` e `ENCERRADO`), bloqueando alterações ou novos lançamentos em períodos encerrados e exigindo permissão especial, justificativa obrigatória e registro na trilha de auditoria para reabertura de um período encerrado.

## 2. Requisitos relacionados
- **RF-012**: Controlar períodos contábeis abertos, em fechamento e encerrados; reabertura exige permissão e justificativa.
- **RB-002**: Períodos encerrados não podem ser alterados sem permissão especial, justificativa e registro de auditoria.

## 3. Escopo
- **Dentro do escopo:**
  - Controle de transição de status dos períodos contábeis por empresa e competência (`ABERTO`, `EM_FECHAMENTO`, `ENCERRADO`).
  - Bloqueio de criação ou alteração de lançamentos/dados do período quando o status for `ENCERRADO`.
  - Reabertura controlada de período `ENCERRADO` para `ABERTO` exigindo: permissão especial (`contabil:periodo:reabrir`), justificativa obrigatória não vazia e registro automático na trilha de auditoria.
- **Fora do escopo:**
  - Apuração automática de resultado do exercício (zeramento de contas de receita/despesa).
  - Emissão de balancetes, Diário e Razão (pertencente a futuras specs de relatórios contábeis).
  - Fechamento fiscal ou de folha de pagamento (Itens 3 e 4).

## 4. Comportamento esperado
- **Fluxo normal (Ciclo de fechamento):** Um período inicia como `ABERTO`, pode avançar para `EM_FECHAMENTO` (revisão/conciliação) e ser finalizado como `ENCERRADO`.
- **Fluxo de restrição (Bloqueio em período encerrado):** Enquanto o período estiver `ENCERRADO`, qualquer tentativa de alteração ou inclusão de lançamento naquele período é bloqueada.
- **Fluxo normal (Reabertura autorizada):** Um usuário com permissão especial (`contabil:periodo:reabrir`) solicita a reabertura de um período `ENCERRADO` informando justificativa clara; o sistema reabre o período para `ABERTO` e grava obrigatoriamente o evento na trilha de auditoria com usuário, data, competência e justificativa.
- **Fluxo de erro (Reabertura sem permissão ou sem justificativa):** Tentativa de reabrir período encerrado por usuário sem a permissão especial ou sem informar justificativa é recusada e o período permanece `ENCERRADO`.

## 5. Critérios de aceite
- **CA-1:** Dada uma empresa e uma competência, quando o período contábil for criado ou transicionado entre `ABERTO`, `EM_FECHAMENTO` e `ENCERRADO`, então o sistema deve persistir e consultar corretamente o status do período (RF-012).
- **CA-2:** Dado um período contábil com status `ENCERRADO`, quando houver tentativa de incluir ou alterar lançamento contábil naquela competência, então o sistema deve bloquear a operação (RF-012, RB-002).
- **CA-3:** Dado um período contábil `ENCERRADO`, quando um usuário sem a permissão especial (`contabil:periodo:reabrir`) ou sem informar justificativa tentar reabri-lo, então o sistema deve recusar a reabertura mantendo o período `ENCERRADO` (RF-012, RB-002).
- **CA-4:** Dado um período contábil `ENCERRADO`, quando um usuário com permissão especial informar uma justificativa válida para reabertura, então o sistema deve reabrir o período para `ABERTO` e registrar a justificativa e o usuário responsável na trilha de auditoria (RF-012, RB-002).

## 6. Plano técnico
- **Modelos e Repositório:**
  - Evolução do controle de `PeriodoContabil` para suportar os 3 estados (`ABERTO`, `EM_FECHAMENTO`, `ENCERRADO`), histórico de fechamento/reabertura e integração com `InMemoryPeriodoContabilRepository` já usado por `LancamentoContabilService`.
- **Serviço (`PeriodoContabilService`):**
  - Métodos `criarOuObterPeriodo`, `iniciarFechamento`, `encerrarPeriodo` e `reabrirPeriodo`.
  - Na reabertura (`reabrirPeriodo`), validar permissão especial via `AutenticacaoService.exigirPermissao(usuarioId, 'contabil:periodo:reabrir')`, exigir justificativa não vazia e gravar evento em `AuditoriaHistoricoService.registrarEvento`.
- **Rotas Express:**
  - `GET /api/empresas/:empresaId/periodos`
  - `POST /api/empresas/:empresaId/periodos/:competencia/fechamento`
  - `POST /api/empresas/:empresaId/periodos/:competencia/encerrar`
  - `POST /api/empresas/:empresaId/periodos/:competencia/reabrir`

## 7. Tarefas de implementação
- [x] Criar branch de trabalho `spec/2.5-periodos-contabeis` a partir da `main`
- [x] Evoluir modelo e repositório de `PeriodoContabil` para suportar `ABERTO`, `EM_FECHAMENTO` e `ENCERRADO` (CA-1)
- [x] Implementar serviço `PeriodoContabilService` com transição de estados, bloqueio de período encerrado e reabertura com permissão, justificativa e auditoria (CA-1, CA-2, CA-3 e CA-4)
- [x] Expor controller e rotas Express para gestão de períodos contábeis
- [x] Implementar testes automatizados cobrindo os critérios CA-1 a CA-4
- [x] Atualizar `CHANGELOG.md` na seção `[Não lançado]`

## 8. Dependências
- `SPEC-1.4` / `SPEC-1.5` (Perfis e verificação de permissões).
- `SPEC-1.9` (Trilha de auditoria imutável).
- `SPEC-2.2` (Lançamentos contábeis que validam período aberto).

## 9. Como validar
1. **Transição de Status (CA-1):** Criar período `2026-11`, transicionar de `ABERTO` → `EM_FECHAMENTO` → `ENCERRADO` e validar o status retornado.
2. **Bloqueio em Período Encerrado (CA-2):** Tentar gravar lançamento contábil na competência `ENCERRADO` e confirmar bloqueio (HTTP 400/422).
3. **Recusa de Reabertura sem Permissão ou Justificativa (CA-3):** Tentar reabrir sem permissão especial (HTTP 403) ou sem justificativa (HTTP 400) e confirmar que o status permanece `ENCERRADO`.
4. **Reabertura Autorizada com Auditoria (CA-4):** Reabrir com usuário autorizado e justificativa válida; confirmar status `ABERTO`, novo lançamento aceito e registro gravado na trilha de auditoria.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/25
- Modelos e Repositório: `src/models/LancamentoContabil.ts`, `src/repositories/PeriodoContabilRepository.ts`
- Serviço, Controller e Rotas: `src/services/PeriodoContabilService.ts`, `src/controllers/PeriodoContabilController.ts`, `src/routes/periodoContabilRoutes.ts`
- Suíte de testes automatizados (`tests/periodosContabeis.test.ts`): 4 cenários aprovados cobrindo integralmente CA-1 a CA-4 (`PASS tests/periodosContabeis.test.ts`).

## 11. Histórico de revisão
*(Nenhuma ressalva registrada até o momento).*
