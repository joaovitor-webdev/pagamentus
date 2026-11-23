# SPEC-1.2 – Arquitetura, stack e ambientes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 1 – Plataforma | @joaovitor-webdev | A definir | https://trello.com/c/LuEhsgst | Fazendo |

## 1. Contexto e objetivo

Registrar a stack usada pelo projeto, as decisões que orientam sua evolução e a configuração dos ambientes de desenvolvimento, teste e produção. A configuração deve impedir que testes usem acidentalmente o banco destinado à aplicação fora do ambiente de teste.

## 2. Requisitos relacionados

- **RF-079:** Manter ambiente de testes separado do ambiente de produção.
- **RNF-007 — Escalabilidade:** Suportar crescimento de clientes, documentos, lançamentos e usuários sem degradação inaceitável. O requisito não define metas quantitativas de carga ou latência.

## 3. Escopo

### Dentro do escopo

- Registrar a stack atual e as decisões de arquitetura relacionadas à escalabilidade.
- Documentar a separação de configuração entre desenvolvimento, teste e produção.
- Validar a escolha do banco conforme `NODE_ENV`, sem permitir fallback de teste para `DATABASE_URL`.
- Documentar exemplos fictícios de configuração por ambiente.

### Fora do escopo

- Provisionar ou operar infraestrutura de produção.
- Definir metas de capacidade, latência ou volume não especificadas no requisito.
- Implementar regras de negócio contábeis, fiscais ou de folha.
- Adotar framework de frontend, ORM, filas ou cache que não estejam estabelecidos no projeto.

## 4. Comportamento esperado

- **Execução normal:** a aplicação usa `DATABASE_URL` em desenvolvimento e produção; testes usam exclusivamente `DATABASE_URL_TEST`.
- **Configuração inválida:** a inicialização do acesso ao banco falha com mensagem explícita quando a variável exigida estiver ausente, a URL for inválida ou o nome do banco não corresponder ao ambiente.
- **Separação local:** os bancos `pagamentus_dev`, `pagamentus_test` e `pagamentus_prod` podem existir no PostgreSQL local para desenvolvimento; isso não representa provisionamento de produção.
- **Escalabilidade:** as decisões documentadas indicam mecanismos disponíveis na stack e registram que o requisito não informa limites quantitativos nem evidências de teste de carga.

## 5. Critérios de aceite

- **CA-1:** Dado o diretório `docs/arquitetura/`, quando o ADR-001 for consultado, então ele deve registrar a stack efetivamente adotada, suas justificativas e as decisões relacionadas à escalabilidade, sem apresentar alternativas como escolhas já concluídas.
- **CA-2:** Dado o ADR-001, quando a seção de ambientes for consultada, então ela deve descrever o uso de `NODE_ENV`, `DATABASE_URL` e `DATABASE_URL_TEST`, os bancos esperados e o fluxo de seleção sem expor credenciais reais.
- **CA-3:** Dado o arquivo `.env.example`, quando ele for consultado, então deve conter exemplos distintos para desenvolvimento, teste e produção, com valores exclusivamente fictícios e indicação de quais variáveis devem ser fornecidas por ambiente.
- **CA-4:** Dado o processo iniciado com `NODE_ENV=test`, quando o acesso ao banco for configurado, então deve usar `DATABASE_URL_TEST`, exigir o banco `pagamentus_test` e falhar explicitamente se a variável estiver ausente ou apontar para outro banco, sem recorrer a `DATABASE_URL`.
- **CA-5:** Dado o processo iniciado com `NODE_ENV=development` ou `NODE_ENV=production`, quando o acesso ao banco for configurado, então deve usar `DATABASE_URL`, exigir respectivamente `pagamentus_dev` ou `pagamentus_prod` e falhar explicitamente se a configuração estiver ausente ou apontar para outro banco.

## 6. Plano técnico

- Registrar no ADR a stack identificada no projeto: Node.js 20, TypeScript, Express, PostgreSQL 16, driver `pg`, npm, Jest, Supertest e Docker Compose. O frontend existente usa HTML, CSS e JavaScript sem framework definido.
- Documentar escalabilidade sem prometer desempenho não medido: I/O assíncrono, pool de conexões PostgreSQL e possibilidade de múltiplas instâncias, condicionada ao compartilhamento de estado e à configuração da infraestrutura.
- Criar um resolvedor compartilhado de configuração PostgreSQL para as duas implementações de conexão existentes.
- Validar ambiente, URL e nome do banco antes de criar pools; exigir `DATABASE_URL_TEST` no modo de teste.
- Provisionar os três bancos lógicos no Compose local e atualizar as instruções de execução.

## 7. Tarefas de implementação

- [ ] Atualizar o ADR-001 com a stack efetiva, decisões e limites conhecidos.
- [ ] Implementar a validação compartilhada das conexões PostgreSQL.
- [ ] Aplicar a validação às duas implementações de pool.
- [ ] Ajustar a inicialização local dos bancos de desenvolvimento, teste e produção simulada.
- [ ] Atualizar `.env.example` e as instruções de execução.
- [ ] Testar os caminhos válidos e inválidos de configuração.
- [ ] Registrar evidências por critério e abrir PR para revisão.

## 8. Dependências

- `SPEC-1.1` — Repositório, documentação e padrões de contribuição.

## 9. Como validar

1. **CA-1:** conferir as tecnologias e justificativas no ADR-001.
2. **CA-2:** verificar o fluxo de seleção por `NODE_ENV` e as variáveis de conexão no ADR-001.
3. **CA-3:** conferir os exemplos fictícios e distintos em `.env.example`.
4. **CA-4:** executar `npm run build` e `npm run test:unit -- --runTestsByPath tests/databaseEnvironment.test.ts`; os casos devem demonstrar seleção exclusiva de `DATABASE_URL_TEST` e rejeição de configuração ausente ou incompatível.
5. **CA-5:** executar os mesmos testes focados e verificar a seleção e rejeição das URLs de desenvolvimento e produção.

## 10. Evidências

A preencher após implementação e validação.

## 11. Histórico de revisão

Nenhuma revisão registrada para esta reimplementação.
