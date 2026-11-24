# SPEC-1.3 – Modelo de dados e integridade

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 1 – Plataforma | @joaovitor-webdev | A definir | https://trello.com/c/gKDxt3kn | Revisando |

## 1. Contexto e objetivo
Atender ao RNF-013 no esquema relacional inicial e no mecanismo de transações, usando chaves e validações do PostgreSQL para evitar duplicidades e inconsistências e revertendo operações incompletas quando uma etapa falhar.

## 2. Requisitos relacionados
- **RNF-013 — Integridade**: Usar transações, chaves e validações para impedir duplicidade, perda de dados e lançamentos inconsistentes.

## 3. Escopo
- **Dentro do escopo:**
  - Validar as chaves primárias, chaves estrangeiras, restrições de unicidade e campos obrigatórios do esquema inicial definido em `001_initial_schema.sql`.
  - Executar por meio do helper transacional as operações que precisem ser atômicas, confirmando-as em caso de sucesso e revertendo-as quando uma etapa falhar.
  - Comprovar a rejeição de uma referência inválida e de uma duplicidade pelo PostgreSQL.
- **Fora do escopo:**
  - Telas ou interfaces de usuário para cadastros (pertencentes a specs de UI/Frontend).
  - Regras de negócio contábeis detalhadas de partidas dobradas e planos de contas específicos (pertencentes ao Item 2).
  - Regras fiscais e cálculo de tributos (pertencentes ao Item 3).
  - Definir regras de unicidade de negócio que não estejam especificadas; a spec verifica as constraints já definidas no esquema inicial.
  - Migrar ou reestruturar tabelas pertencentes a outras specs.

## 4. Cenários
- **Persistência válida:** operações concluídas na transação são confirmadas; as relações e constraints do esquema inicial permanecem ativas.
- **Falha intermediária:** se uma operação posterior falhar, as gravações anteriores da mesma transação não permanecem no banco.
- **Duplicidade ou referência inválida:** o PostgreSQL rejeita a gravação que viola uma constraint, preservando os dados válidos existentes.

## 5. Critérios de aceite
- **CA-1:** Dado o esquema inicial definido em `001_initial_schema.sql`, quando forem inspecionadas suas tabelas e relações, então cada tabela deve ter chave primária, as relações declaradas devem ter chaves estrangeiras, e as restrições de unicidade e obrigatoriedade definidas no esquema devem estar ativas.
- **CA-2:** Dada uma transação com mais de uma gravação, quando uma etapa posterior lançar uma exceção, então a transação deve executar rollback e nenhuma gravação anterior dessa transação pode permanecer persistida.
- **CA-3:** Dado um registro persistido sob uma constraint de unicidade, quando outra gravação violar essa mesma constraint, então o PostgreSQL deve rejeitá-la e manter inalterado o registro original.

## 6. Plano técnico
- PostgreSQL e migração `src/database/migrations/001_initial_schema.sql` para o esquema estrutural inicial.
- `DatabaseConnection.transaction` em `src/database/connection.ts` encapsula as operações atômicas em `BEGIN`, `COMMIT` e `ROLLBACK`.
- `src/tests/integrity.test.ts` valida o catálogo do esquema inicial e executa verificações de FK, unicidade e rollback em banco de teste.

## 7. Tarefas de implementação
- [x] Revalidar o esquema estrutural inicial e o helper de transação contra os critérios desta spec.
- [x] Cobrir por teste a estrutura PK/FK/UNIQUE/NOT NULL do esquema inicial.
- [x] Cobrir rejeição de duplicidade, preservação do registro original e rollback após falha intermediária.
- [x] Executar build e testes; registrar resultados e limitações de ambiente.
- [x] Atualizar a entrada da SPEC-1.3 no `CHANGELOG.md` e anexar evidências do PR.

## 8. Dependências
- `SPEC-1.1` (Repositório, documentação e padrões de contribuição).
- `SPEC-1.2` (Arquitetura, stack e ambientes).

## 9. Como validar
1. Configure `NODE_ENV=test` e `DATABASE_URL_TEST` para um banco PostgreSQL de teste chamado `pagamentus_test`; não use dados reais.
2. Execute `npm run build` para validar a compilação.
3. Execute `npm run test:integrity` para aplicar as migrações e validar CA-1, CA-2 e CA-3.
4. Confirme nos resultados que as constraints do esquema foram encontradas, a duplicidade foi rejeitada, o registro original permaneceu e a linha da primeira gravação foi removida após rollback.
5. Execute `npx jest --runInBand tests/databaseConnection.test.ts` para validar os comandos de commit e rollback do helper.

## 10. Evidências (preencher ao concluir)
- PR: a preencher após abertura.
- CA-1: `npm run test:integrity` passou; foram identificadas 6 tabelas com PK, 5 FKs, 5 constraints UNIQUE e 29 campos NOT NULL. A inserção com FK inválida foi rejeitada (código PostgreSQL 23503).
- CA-2: `npm run test:integrity` passou após uma inserção válida e uma exceção simulada na etapa seguinte; a consulta confirmou que o registro não permaneceu no banco.
- CA-3: `npm run test:integrity` passou; a duplicidade foi rejeitada (código PostgreSQL 23505), sem alterar o registro original.
- `npx jest --runInBand tests/databaseConnection.test.ts`: 2 testes passaram.
- `npm run build`: passou.
- `npm test`: 33 de 34 suítes e 141 de 147 testes passaram. Os 6 casos restantes são da integração preexistente SPEC-4.2, que falha porque `system_parameters` não existe no banco temporário; não relacionada a esta spec.

## 11. Histórico de revisão
- Reimplementação SDD: escopo limitado ao esquema estrutural inicial e às garantias de integridade previstas no RNF-013.
