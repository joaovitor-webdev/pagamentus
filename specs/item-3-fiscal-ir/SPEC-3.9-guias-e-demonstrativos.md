# SPEC-3.9 – Guias e demonstrativos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | Matheus Barbosa | A definir | https://trello.com/c/n4uF6CZw | Feito |

## 1. Contexto e objetivo
Esta especificação define a preparação de guias e demonstrativos fiscais para conferência, deixando explícito quando uma guia ainda não foi transmitida. A geração para conferência não deve ser interpretada como transmissão automática quando não houver integração homologada.

## 2. Requisitos relacionados
- **RF-023:** Preparar guias e demonstrativos para conferência, sem assumir transmissão automática quando não houver integração homologada.

## 3. Escopo
- **Dentro do escopo:**
  - Preparar guias e demonstrativos para conferência.
  - Identificar como não transmitida a guia gerada para conferência.
  - Não presumir nem indicar transmissão automática sem integração homologada.
- **Fora do escopo:**
  - Transmitir guias automaticamente sem integração homologada.
  - Definir integrações, formatos de guia ou demonstrativo não especificados no requisito.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário solicita a preparação de uma guia e de demonstrativos para conferência.
  - O sistema disponibiliza a guia para conferência com a indicação de que não foi transmitida.
- **Fluxo de exceção:**
  - Na ausência de integração homologada, a preparação da guia não realiza nem presume sua transmissão.

## 5. Critérios de aceite
- **CA-1 (Guia para conferência):** Dado que o usuário solicite a preparação de uma guia, Quando o sistema a gerar para conferência, Então deve disponibilizá-la marcada como não transmitida.
- **CA-2 (Demonstrativos para conferência):** Dado que o usuário solicite demonstrativos, Quando o sistema os preparar, Então deve disponibilizá-los para conferência.
- **CA-3 (Ausência de integração homologada):** Dado que não haja integração homologada, Quando uma guia for preparada para conferência, Então o sistema não deve transmiti-la automaticamente nem indicá-la como transmitida.

## 6. Plano técnico
- `POST /api/empresas/:empresaId/fiscal/guias`: preparar os dados da guia para conferência e retornar `statusTransmissao: NAO_TRANSMITIDA`.
- `POST /api/empresas/:empresaId/fiscal/demonstrativos`: preparar os dados do demonstrativo para conferência.
- Não incluir nem acionar transmissão automática na ausência de integração homologada.

## 7. Tarefas de implementação
- [x] Implementar a preparação de guias e demonstrativos para conferência.
- [x] Garantir que a guia gerada para conferência seja identificada como não transmitida.
- [x] Garantir que não ocorra nem seja indicada transmissão automática sem integração homologada.
- [x] Criar testes que verifiquem os critérios de aceite.

## 8. Dependências
- Não informadas no requisito.

## 9. Como validar
1. Solicitar a preparação de uma guia e confirmar que ela é disponibilizada para conferência marcada como não transmitida (**CA-1**).
2. Solicitar demonstrativos e confirmar que são disponibilizados para conferência (**CA-2**).
3. Sem integração homologada, preparar uma guia e confirmar que ela não é transmitida automaticamente nem indicada como transmitida (**CA-3**).
4. Executar `npx jest tests/guiasDemonstrativosFiscais.test.ts --runInBand` e confirmar os três testes.
5. Executar `npm run build` para validar a compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- `npx jest tests/guiasDemonstrativosFiscais.test.ts --runInBand`: aprovado (1 suíte, 3 testes, cobrindo CA-1 a CA-3).
- `npm run build`: concluído sem erros.
- `npx jest --runInBand`: aprovado (32 suítes, 136 testes).
- Implementação em `src/models/GuiaDemonstrativoFiscalModel.ts`, `src/services/GuiaDemonstrativoFiscalService.ts`, `src/controllers/GuiaDemonstrativoFiscalController.ts`, `src/routes/guiaDemonstrativoFiscalRoutes.ts` e `src/app.ts`.
- Testes em `tests/guiasDemonstrativosFiscais.test.ts`.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
