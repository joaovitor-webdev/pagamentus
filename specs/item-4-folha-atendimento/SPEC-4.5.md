# SPEC-4.5 – Aprovação da folha e dados sensíveis

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | A definir | A definir | Implementada; perfis ainda simulados |

## 1. Contexto e objetivo

Definir o registro da trilha de aprovação da folha e a restrição de acesso a dados salariais e de saúde, conforme RF-056. As ações relevantes devem manter os dados de auditoria previstos no RNF-004.

## 2. Requisitos relacionados

- **RF-056**: manter trilha de aprovação e restringir dados salariais e de saúde a usuários autorizados.
- **RNF-001**: aplicar menor privilégio e segregação entre clientes.
- **RNF-004**: registrar ações relevantes com usuário, horário, objeto, operação e resultado.

## 3. Escopo

- **Dentro do escopo:**
  - Registrar a aprovação da folha e os dados da ação na trilha de auditoria.
  - Permitir aprovação somente a usuários autorizados.
  - Restringir a usuários autorizados a consulta de dados salariais e de saúde.
  - Impedir que usuários sem autorização obtenham valores legíveis desses dados por telas ou API.
  - Usar perfil sem privilégios como padrão quando não houver perfil informado.
- **Fora do escopo:**
  - Aprovação de declarações, apurações ou obrigações fora da folha de pagamento.
  - Definição de novos dados clínicos ou avaliação de informações de saúde.
  - Alteração dos cálculos e dos valores da folha.

## 4. Comportamento esperado

### Fluxo de aprovação

1. Um usuário autorizado solicita a aprovação de uma folha calculada.
2. O sistema atualiza o status da folha e registra a ação na trilha de auditoria.
3. O registro permite identificar o usuário, horário, folha afetada, operação e resultado.

### Fluxo de acesso restrito

1. Um usuário autorizado consulta dados salariais ou de saúde e recebe os dados conforme sua permissão.
2. Um usuário sem autorização consulta os mesmos dados.
3. O sistema bloqueia a consulta ou oculta os valores sensíveis tanto na interface quanto na resposta da API.

### Fluxo de erro

1. Um usuário sem autorização tenta aprovar a folha.
2. O sistema nega a operação e mantém o status da folha inalterado.

## 5. Critérios de aceite

- **CA-1 – Aprovação auditada:** Dado que existe uma folha calculada e o usuário está autorizado, quando ele aprovar a folha, então o status será atualizado e a trilha registrará usuário, horário, folha, operação e resultado.
- **CA-2 – Aprovação não autorizada:** Dado que o usuário não tem autorização para aprovar, quando tentar aprovar a folha, então o sistema negará a operação, não alterará o status e registrará o resultado da tentativa na trilha.
- **CA-3 – Consulta autorizada:** Dado que o usuário tem autorização para consultar dados salariais e de saúde, quando acessar esses dados, então o sistema os disponibilizará conforme sua permissão.
- **CA-4 – Restrição de dados sensíveis:** Dado que o usuário não tem autorização para consultar dados salariais ou de saúde, quando acessar a interface ou API que os apresenta, então o sistema bloqueará o acesso ou ocultará os valores, sem retorná-los em formato legível.
- **CA-5 – Consulta da trilha:** Dado que houve uma aprovação ou tentativa negada, quando um usuário autorizado consultar a trilha, então encontrará o registro correspondente com usuário, horário, objeto, operação e resultado.

## 6. Plano técnico

- Reutilizar o controle de perfil/autorização nas rotas de folha.
- Registrar as aprovações e tentativas negadas na trilha de auditoria, vinculadas à folha.
- Aplicar a autorização ou ocultação dos dados sensíveis nas respostas da API e nas telas que os exibem.
- Validar os fluxos com testes de integração contra PostgreSQL.

## 7. Tarefas de implementação

- [x] Aplicar a checagem de perfil disponível para aprovação da folha.
- [x] Registrar aprovações e tentativas negadas com usuário, horário, objeto, operação e resultado.
- [x] Restringir a consulta de dados salariais e de saúde na API e na interface.
- [x] Criar testes de aprovação autorizada e negada.
- [x] Criar testes de acesso autorizado e não autorizado aos dados sensíveis.

## 8. Dependências

- **SPEC-4.1**: cadastro de empregados, processamento da folha e perfis usados nas telas.
- Estrutura de auditoria e permissões disponibilizada pela plataforma.

## 9. Como validar

1. Configure `DATABASE_URL` para um banco PostgreSQL de desenvolvimento e execute `npm run dev`.
2. Calcule e grave uma folha para a competência de teste.
3. Como usuário autorizado, aprove a folha e consulte `GET /api/payroll/audit-logs`; confirme o status e o registro correspondente.
4. Como usuário sem permissão, tente aprovar a mesma folha; confirme a negação e que o status não foi alterado.
5. Consulte dados salariais e de saúde com usuários autorizados e não autorizados, tanto pela interface quanto pela API; confirme que somente o usuário autorizado obtém valores legíveis.
6. Configure `DATABASE_URL_TEST` para um PostgreSQL de teste e execute `npm run test:unit -- --runInBand tests/spec45-approval-sensitive.integration.test.ts`.

## 10. Evidências (preencher ao concluir)

- PR: não criado.
- `npm run build` — passou.
- `node --check src/public/js/app.js` e `git diff --check` — passaram.
- Com PostgreSQL temporário configurado em `DATABASE_URL_TEST`, `npm run test:unit -- --runInBand tests/spec45-approval-sensitive.integration.test.ts` — passou (3 testes).
- Os testes validam aprovação registrada, tentativa negada sem mudança de status e bloqueio/mascaramento dos dados sensíveis.
- Validação manual e capturas de tela: não realizadas.

**Limitação:** a autorização atual utiliza o seletor e os cabeçalhos de perfil simulados já existentes no sistema; eles não autenticam a identidade do solicitante. A integração com autenticação confiável/JWT prevista na arquitetura continua necessária antes de tratar essas verificações como controle de produção.

## 11. Histórico de revisão

