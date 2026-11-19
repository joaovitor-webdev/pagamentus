# SPEC-4.6 – Calendário e versões de leiautes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | A definir | A definir | A fazer |

## 1. Contexto e objetivo

Definir a manutenção de um calendário fiscal/trabalhista parametrizado e o controle de versões dos artefatos relacionados às obrigações, conforme RF-061 e RF-064.

## 2. Requisitos relacionados

- **RF-061**: manter calendário fiscal/trabalhista parametrizado por cliente, regime, município/UF e período.
- **RF-064**: controlar versões de leiautes, recibos, protocolos, comprovantes e retificações.

## 3. Escopo

- **Dentro do escopo:**
  - Manter o calendário fiscal/trabalhista considerando cliente, regime, município/UF e período.
  - Controlar versões de leiautes, recibos, protocolos, comprovantes e retificações.
- **Fora do escopo:**
  - Criar tarefas, responsáveis, prazos, prioridades, checklists ou anexos de tarefas (RF-062).
  - Enviar notificações de vencimento ou atraso (RF-063).
  - Criar obrigações, leiautes ou formatos não definidos nos requisitos relacionados.

## 4. Comportamento esperado

### Fluxo do calendário

1. O sistema mantém as informações do calendário fiscal/trabalhista associadas ao cliente, regime, município/UF e período.
2. O calendário pode ser consultado considerando esses parâmetros.
3. As informações de um cliente e de seus parâmetros não se confundem com as de outros clientes ou combinações.

### Fluxo de versões

1. O sistema registra versões de leiautes, recibos, protocolos e comprovantes.
2. Quando houver uma retificação, ela é registrada e distinguida das versões anteriores do artefato correspondente.
3. As versões registradas permanecem distinguíveis entre si.

## 5. Critérios de aceite

- **CA-1 – Calendário parametrizado:** Dado um calendário fiscal/trabalhista, quando suas informações forem mantidas, então estarão associadas ao cliente, regime, município/UF e período correspondentes.
- **CA-2 – Consulta do calendário:** Dado que existam informações para diferentes clientes, regimes, municípios/UF ou períodos, quando o calendário for consultado pelos parâmetros correspondentes, então serão apresentadas as informações da combinação consultada.
- **CA-3 – Versões de artefatos:** Dado que exista um leiaute, recibo, protocolo ou comprovante, quando uma nova versão for registrada, então ela será distinguível das versões anteriormente registradas, sem substituí-las.
- **CA-4 – Retificações:** Dado que um artefato tenha sido retificado, quando a retificação for registrada, então a versão retificada será distinguível da versão anterior.

## 6. Plano técnico

- Reutilizar os dados de cliente e os parâmetros de regime e município/UF disponíveis na plataforma.
- Armazenar e consultar as informações do calendário considerando cliente, regime, município/UF e período.
- Representar os tipos de artefato previstos no RF-064 com versões distinguíveis, incluindo retificações.
- Validar a consulta do calendário e o registro de versões com testes contra PostgreSQL.

## 7. Tarefas de implementação

- [ ] Confirmar os dados de cliente, regime, município/UF e período disponíveis para o calendário.
- [ ] Implementar a manutenção e consulta do calendário fiscal/trabalhista por esses parâmetros.
- [ ] Implementar o registro de versões de leiautes, recibos, protocolos e comprovantes.
- [ ] Implementar o registro de retificações como versões distinguíveis das anteriores.
- [ ] Criar testes de integração para os critérios de aceite.

## 8. Dependências

- **SPEC-4.1**: plataforma e dados utilizados pelo módulo de folha e atendimento.
- **RF-061 e RF-064**: requisitos funcionais que definem o calendário e o controle de versões desta spec.

## 9. Como validar

1. Configure `DATABASE_URL` para um banco PostgreSQL de desenvolvimento e execute `npm run dev`.
2. Registre informações de calendário para diferentes clientes, regimes, municípios/UF e períodos; consulte cada combinação e confirme que os resultados correspondem aos parâmetros consultados.
3. Registre versões de leiaute, recibo, protocolo e comprovante; confirme que cada versão pode ser distinguida das anteriores.
4. Registre uma retificação e confirme que ela é distinguível da versão anterior do artefato.
5. Execute os testes de integração criados para a SPEC-4.6.

## 10. Evidências (preencher ao concluir)

- Link do PR.
- Resultado dos testes dos critérios de aceite.
- Evidência do calendário consultado por cliente, regime, município/UF e período.
- Evidência das versões registradas e da retificação.

## 11. Histórico de revisão
