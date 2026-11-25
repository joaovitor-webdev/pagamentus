# SPEC-4.2 – Eventos variáveis e afastamentos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | @joaovitor-webdev | A definir | Feito |

## 1. Contexto e objetivo

Especificar o registro de informações variáveis da folha e do vínculo do empregado, conforme RF-053: eventos, dados de ponto, afastamentos e licenças, benefícios e alterações contratuais.

## 2. Requisitos relacionados

- **RF-053**: registrar eventos variáveis, ponto importado, afastamentos, licenças, benefícios e alterações contratuais.

## 3. Escopo

- **Dentro do escopo:**
  - Registrar horas extras, adicionais, faltas e outros lançamentos variáveis por empregado e competência.
  - Importar lote ou payload estruturado de marcações, horas trabalhadas e horas extras do empregado.
  - Registrar afastamentos temporários e licenças com início, fim e motivo, validando coerência das datas e sobreposições.
  - Registrar e vincular ao empregado benefícios de vale-transporte, vale-refeição/alimentação e plano de saúde, com valores e descontos aplicáveis.
  - Registrar mudanças de cargo, jornada, departamento ou regime contratual, preservando histórico auditável.
  - Validar existência do empregado, valores e isolamento entre tenants pelo `search_path`.
- **Fora do escopo:**
  - Funcionalidades não descritas no RF-053.

## 4. Comportamento esperado

### Fluxo normal

1. Dado um empregado existente, o usuário registra eventos variáveis para uma competência.
2. O usuário envia um lote ou payload estruturado de ponto do empregado para importação.
3. O usuário registra um afastamento ou licença informando início, fim e motivo.
4. O usuário registra e vincula ao empregado um benefício com valor e desconto aplicável.
5. O usuário registra uma mudança de cargo, jornada, departamento ou regime; o histórico da alteração é mantido.

### Fluxo de exceção

1. Uma operação que referencia empregado inexistente é rejeitada.
2. Datas incoerentes ou período sobreposto em afastamento/licença são rejeitados.
3. Valores inválidos são rejeitados.
4. Dados de um tenant não são acessíveis nem vinculados a empregado de outro tenant.

## 5. Critérios de aceite

- **CA-1 – Eventos variáveis:** Dado um empregado existente no tenant ativo, quando forem registrados horas extras, adicionais, faltas ou outro lançamento variável para uma competência, então os eventos ficam associados ao empregado e à competência, após validar o empregado e os valores.
- **CA-2 – Importação de ponto:** Dado um empregado existente no tenant ativo, quando for enviado um lote ou payload estruturado com marcações, horas trabalhadas e horas extras, então os registros válidos são associados ao empregado e os dados inválidos ou de outro tenant são rejeitados.
- **CA-3 – Afastamentos e licenças:** Dado um empregado existente, quando for registrado um afastamento ou licença com datas de início e fim e motivo, então o registro é aceito somente se as datas forem coerentes e não houver sobreposição com outro período do empregado.
- **CA-4 – Benefícios:** Dado um empregado existente, quando for registrado um benefício de vale-transporte, vale-refeição/alimentação ou plano de saúde com valor e desconto aplicável, então o benefício fica vinculado ao empregado após a validação do empregado e dos valores.
- **CA-5 – Alterações contratuais:** Dado um empregado existente, quando for registrada mudança de cargo, jornada, departamento ou regime contratual, então a mudança fica registrada e seu histórico pode ser auditado.
- **CA-6 – Isolamento por tenant:** Dado um tenant selecionado pelo `search_path`, quando uma operação consultar ou vincular empregado, então somente dados pertencentes ao tenant ativo podem ser utilizados.

## 6. Plano técnico

- Implementar os fluxos nas rotas do módulo de folha, seguindo os padrões existentes.
- Persistir os dados em tabelas do schema tenant selecionado pelo `search_path`, com referências ao empregado e validações de integridade.
- Usar migrations SQL para as estruturas necessárias.
- Validar os critérios com testes de integração contra PostgreSQL.

## 7. Tarefas de implementação

- [x] Criar migrations SQL para as estruturas necessárias ao RF-053 no schema tenant.
- [x] Implementar registro e validação de eventos variáveis.
- [x] Implementar importação estruturada de ponto.
- [x] Implementar registro de afastamentos e licenças com validação de período.
- [x] Implementar registro de benefícios vinculados ao empregado.
- [x] Implementar registro de alterações contratuais com histórico.
- [x] Criar e executar testes de integração para os critérios de aceite.

## 8. Dependências

- **SPEC-4.1**: cadastro de empregados, necessário para validar e vincular os registros.
- Schema PostgreSQL do tenant selecionado pelo `search_path`.

## 9. Como validar

1. Aplicar a migration no schema tenant configurado no `search_path`.
2. Com um empregado existente, validar o registro de cada tipo de evento variável por competência.
3. Importar um lote válido de ponto e tentar importar dados inválidos ou associados a outro tenant.
4. Registrar afastamentos com período coerente, período incoerente e período sobreposto.
5. Registrar benefícios dos tipos previstos com valores válidos e inválidos.
6. Registrar cada tipo de alteração contratual e verificar o histórico.
7. Repetir operações com empregado inexistente ou de outro tenant e confirmar a rejeição.

Suíte automatizada: `npm test`.

## 10. Evidências

- **PR:** https://github.com/joaovitor-webdev/pagamentus/pull/13 (mergeado e aprovado).
- Testes de integração PostgreSQL em [spec42-rf053.integration.test.ts](../../tests/spec42-rf053.integration.test.ts): **6/6 aprovados**.
- Suíte completa via `npm test`: **32/32 suítes, 136/136 testes aprovados**.
- `npm run build`: aprovado.

## 11. Histórico de revisão

- **17/11/2026**: especificação RF-053 redigida.
