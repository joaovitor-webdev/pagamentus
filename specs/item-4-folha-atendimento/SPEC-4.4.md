# SPEC-4.4 – Recibos, relatórios e eventos oficiais

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | A definir | A definir | Fazendo |

## 1. Contexto e objetivo

Definir a geração de recibos, relatórios e informações da folha destinadas a sistemas oficiais, conforme RF-054 e RF-055. O preparo de eventos oficiais deve seguir o leiaute vigente aplicável, sem presumir transmissão automática ou conformidade sem validação profissional.

## 2. Requisitos relacionados

- **RF-054**: preparar eventos e informações para sistemas oficiais de folha/trabalho quando aplicável, conforme leiaute vigente.
- **RF-055**: gerar recibos, relatórios de folha, provisões, encargos e lançamentos contábeis integrados.
- **RB-010**: tabelas, fórmulas, integrações e obrigações precisam de manutenção e validação profissional; o sistema não deve prometer conformidade automática.

## 3. Escopo

- **Dentro do escopo:**
  - Preparar eventos e informações para sistemas oficiais de folha/trabalho, quando aplicável, conforme o leiaute vigente.
  - Gerar recibos e relatórios de folha.
  - Gerar provisões, encargos e lançamentos contábeis integrados à folha.
- **Fora do escopo:**
  - Presumir transmissão direta a sistemas oficiais sem integração disponível, autorização e atendimento às regras técnicas aplicáveis.
  - Prometer conformidade automática ou substituir a validação profissional.
  - Definir formatos, campos ou leiautes não especificados nos requisitos relacionados.

## 4. Comportamento esperado

### Fluxo normal

1. A partir dos dados de folha disponíveis, o usuário solicita recibos e relatórios de folha.
2. O sistema disponibiliza os recibos e relatórios gerados a partir desses dados.
3. O sistema gera as provisões e os encargos da folha e os lançamentos contábeis integrados.
4. Quando aplicável, o sistema prepara os eventos e informações destinados a sistemas oficiais conforme o leiaute vigente.

### Limite de integração

1. O preparo de eventos oficiais não implica que os dados foram transmitidos.
2. A conformidade de tabelas, fórmulas e integrações depende de manutenção e validação profissional.

## 5. Critérios de aceite

- **CA-1 – Eventos oficiais:** Dado que há informações de folha destinadas a um sistema oficial aplicável, quando o usuário solicitar seu preparo, então o sistema produzirá os eventos e informações conforme o leiaute vigente aplicável.
- **CA-2 – Limite da transmissão:** Dado que os eventos oficiais foram preparados, quando o sistema apresentar o resultado, então não indicará que houve transmissão sem que exista integração disponível e autorizada e que as regras técnicas aplicáveis sejam atendidas.
- **CA-3 – Recibos:** Dado que há dados de folha disponíveis, quando o usuário solicitar os recibos, então o sistema os gerará a partir desses dados.
- **CA-4 – Relatórios de folha:** Dado que há dados de folha disponíveis, quando o usuário solicitar os relatórios de folha, então o sistema os gerará a partir desses dados.
- **CA-5 – Provisões e encargos:** Dado que há dados de folha disponíveis, quando o usuário solicitar a geração de provisões e encargos, então o sistema os disponibilizará associados aos dados da folha.
- **CA-6 – Lançamentos contábeis integrados:** Dado que há dados de folha disponíveis, quando forem gerados os lançamentos contábeis correspondentes, então eles estarão integrados à folha.
- **CA-7 – Validação profissional:** Dado que o sistema prepara eventos, recibos, relatórios, provisões, encargos ou integrações, quando apresentar esses resultados, então não prometerá conformidade automática nem substituirá a validação profissional.

## 6. Plano técnico

- Reutilizar os dados de folha para gerar recibos, relatórios, provisões, encargos e lançamentos contábeis integrados.
- Preparar eventos e informações oficiais conforme o leiaute vigente aplicável, sem presumir transmissão.
- Manter os detalhes de formato e integração limitados ao que for definido para o sistema oficial aplicável e validado profissionalmente.

## 7. Tarefas de implementação

- [x] Reutilizar os recibos e relatórios de folha gerados a partir dos dados disponíveis.
- [x] Persistir os totais de provisões, encargos e lançamento contábil associados à execução da folha.
- [ ] Confirmar e preparar os eventos conforme o leiaute oficial vigente aplicável, quando definido.
- [x] Identificar a saída atual como simulada, sem declarar transmissão ou conformidade automática.
- [x] Criar testes de integração para os fluxos implementados.

## 8. Dependências

- **SPEC-4.1**: cadastro de empregados e dados de processamento da folha que servem de origem para as gerações previstas nesta spec.

## 9. Como validar

1. Configure `DATABASE_URL` para um banco PostgreSQL de desenvolvimento e execute `npm run dev`.
2. Calcule e grave uma folha; confirme os totais contábeis associados na tela e na resposta de `POST /api/payroll/calculate`.
3. Consulte `GET /api/payroll/preview/:competencia` e `GET /api/payroll/receipt/:competencia/:employeeId`; confirme o relatório, o lançamento associado e o recibo.
4. Consulte `GET /api/esocial/preview/:competencia`; confirme que a saída está identificada como simulada e não transmitida.
5. Quando houver leiaute oficial vigente definido, valide os eventos preparados contra esse leiaute.
6. Execute `npm run test:unit -- --runInBand tests/spec44-payroll-artifacts.integration.test.ts`.

## 10. Evidências (preencher ao concluir)

- `npm run build`: aprovado.
- `node --check src/public/js/app.js`: aprovado.
- Testes de integração da SPEC-4.4: 2/2 aprovados em PostgreSQL temporário isolado.
- A validação de conformidade com leiaute oficial permanece pendente até que o leiaute aplicável seja definido.

## 11. Histórico de revisão

