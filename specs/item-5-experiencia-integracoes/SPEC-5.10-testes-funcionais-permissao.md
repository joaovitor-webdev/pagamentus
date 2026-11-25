# SPEC-5.10 – Testes funcionais e de permissão

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 5 – Experiência, relatórios, integrações e testes | @5g8p6bzzxf-crypto | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **suíte de testes funcionais e de controle de permissão** do sistema, validando ponta a ponta o comportamento esperado dos principais fluxos de negócio e o bloqueio de acessos não autorizados entre perfis e clientes.

## 2. Requisitos relacionados
- Oriundo do planejamento do projeto (validação transversal de fluxos funcionais e controle de permissões/acesso).

## 3. Escopo
- **Dentro do escopo:**
  - Suíte automatizada de testes funcionais cobrindo fluxos completos de Fiscal, Imposto de Renda e Atendimento/Portal.
  - Suíte automatizada de testes de permissão validando:
    1. Bloqueio de aprovação fiscal por perfil não autorizado (`HTTP 403`) e liberação para perfil autorizado (`CONTADOR`),
    2. Bloqueio de leitura de documentos restritos de IRPF por perfil não autorizado (`HTTP 403`) e liberação para perfil autorizado,
    3. Isolamento de documentos entre clientes distintos no Portal do Cliente, e
    4. Bloqueio de ações proibidas pela política documental (`COMPARTILHAMENTO` proibido → `HTTP 403`).
- **Fora do escopo:**
  - Testes de carga/desempenho (SPEC-5.9) e testes de recuperação de desastres (SPEC-5.11).

## 4. Comportamento esperado
- **Fluxo normal:**
  - Ao executar a suíte `tests/spec510-funcionaisPermissao.test.ts`, todos os cenários funcionais e de permissão passam sem falhas.
- **Fluxo de erro/exceção:**
  - Qualquer tentativa de ação sem permissão ou acesso cruzado entre clientes é explicitamente bloqueada (HTTP 403 ou lista isolada vazia).

## 5. Critérios de aceite
- **CA-1 (Testes funcionais de fluxos de negócio):** Dados fluxos de negócio de Fiscal, IRPF e Portal do Cliente, quando a suíte funcional for executada, então todas as operações válidas devem concluir com sucesso (`HTTP 200/201`).
- **CA-2 (Testes de permissão por perfil):** Dadas rotas protegidas por perfil (aprovação profissional fiscal, documentos restritos de IRPF e políticas de compartilhamento), quando um perfil não autorizado tentar executar a ação, então o sistema deve bloquear com `HTTP 403`.
- **CA-3 (Isolamento entre clientes):** Dados dois clientes distintos no Portal do Cliente, quando o cliente B consultar seus documentos, então o sistema não deve retornar documentos do cliente A.

## 6. Plano técnico
- **Testes (`tests/spec510-funcionaisPermissao.test.ts`):** Testes automatizados com Jest + Supertest exercitando `criarApp()`.

## 7. Tarefas de implementação
- [x] Criar suíte de testes funcionais e de permissão em `tests/spec510-funcionaisPermissao.test.ts`.
- [x] Executar `npx jest tests/spec510-funcionaisPermissao.test.ts` e `npm run build` e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.12`, `SPEC-3.20`, `SPEC-4.9`, `SPEC-4.11`.

## 9. Como validar
1. Executar `npx jest tests/spec510-funcionaisPermissao.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Suíte `tests/spec510-funcionaisPermissao.test.ts` executada com `npx jest tests/spec510-funcionaisPermissao.test.ts` (1 suíte, 3 testes aprovados: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/75

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
