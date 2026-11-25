# SPEC-3.3 – Validação fiscal e duplicidades

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/miNCCfqQ | Feito |

## 1. Contexto e objetivo
Esta especificação define a **validação fiscal de documentos e notas** quanto a campos fiscais, datas, valores, participantes, códigos tributários e **detecção de duplicidades** conforme regras configuradas por empresa, retornando os motivos claros de rejeição.

## 2. Requisitos relacionados
- **RF-018:** Validar campos fiscais, datas, valores, participantes, códigos tributários e duplicidades conforme regras configuradas.

## 3. Escopo
- **Dentro do escopo:**
  - Configuração de regras de validação fiscal por empresa (códigos tributários permitidos — ex.: CFOP/CST/CSOSN —, exigência de coerência entre data de emissão e competência, e habilitação de bloqueio de duplicidade).
  - Validação de documento/nota fiscal contra as regras configuradas e contra os documentos/notas já registrados na empresa (`NotaFiscalRepository` e `DocumentoFiscalImportadoRepository` ou registros validados).
  - Retorno objetivo informando aprovação (`valido: true`) ou rejeição (`valido: false`, HTTP 422 ou 400 conforme endpoint) acompanhada da lista detalhada de motivos (`campo`, `codigoRegra`, `motivo`).
- **Fora do escopo:**
  - Consulta externa na SEFAZ/Receita Federal para situação cadastral ou autorização de NF-e.
  - Manutenção automática de tabelas tributárias oficiais (os códigos permitidos são configuráveis por empresa).
  - Correção ou saneamento automático dos campos rejeitados.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário configura (ou utiliza as regras padrão) da empresa e submete um documento/nota para validação fiscal.
  - O sistema verifica campos obrigatórios, formato e coerência de datas (`dataEmissao` e `competencia`), valores positivos, dados do participante, códigos tributários permitidos e ausência de duplicidade.
  - Estando tudo conforme, retorna `valido: true` sem motivos de erro.
- **Fluxo de erro/exceção:**
  - Se houver qualquer campo fiscal inválido, data incoerente, valor <= 0, participante inválido, código tributário fora da regra ou documento duplicado (mesma chave de acesso ou mesmo `tipo + numero + serie + participanteDocumento`), o sistema rejeita e devolve todos os motivos encontrados.

## 5. Critérios de aceite
- **CA-1 (Configuração de regras e aprovação de documento válido):** Dada uma empresa com regras fiscais configuradas, quando for submetido um documento fiscal com campos, datas, valores, participante e códigos tributários válidos e sem duplicidade, então o sistema deve aprovar a validação (`valido: true`, sem erros) (RF-018).
- **CA-2 (Rejeição por campos, datas, valores, participantes ou códigos tributários inválidos):** Dada uma empresa com regras configuradas, quando forem enviados campos fiscais inválidos (data/competência inválida ou divergente, valor <= 0, participante ausente/inválido ou código tributário não permitido), então o sistema deve rejeitar o documento listando cada motivo de rejeição (RF-018).
- **CA-3 (Rejeição por duplicidade com o motivo):** Dada uma empresa que já possui documento/nota com a mesma chave de acesso ou mesma combinação (`tipo`, `numero`, `serie`, `participanteDocumento`), quando for submetido documento duplicado, então o sistema deve rejeitar informando explicitamente o motivo de duplicidade (RF-018).
- **CA-4 (Validação da configuração de regras):** Dada a tentativa de configurar regras fiscais para a empresa, quando faltarem parâmetros obrigatórios ou houver parâmetros inválidos na regra, então o sistema deve recusar a configuração (RF-018).

## 6. Plano técnico
- **Modelos (`src/models/ValidacaoFiscalModel.ts`):** Tipos para `RegraValidacaoFiscal`, `DocumentoParaValidacaoFiscal`, `MotivoRejeicaoFiscal` e `ResultadoValidacaoFiscal`.
- **Repositório (`src/repositories/ValidacaoFiscalRepository.ts`):** Interface `IValidacaoFiscalRepository` e `InMemoryValidacaoFiscalRepository` para persistir regras configuradas por empresa.
- **Serviço (`src/services/ValidacaoFiscalService.ts`):** Configuração de regras e motor de validação integrado a `INotaFiscalRepository` e `IDocumentoFiscalImportadoRepository` para detecção de duplicidades.
- **Controller e Rotas (`src/controllers/ValidacaoFiscalController.ts` e `src/routes/validacaoFiscalRoutes.ts`):**
  - `PUT /api/empresas/:empresaId/fiscal/regras-validacao`
  - `GET /api/empresas/:empresaId/fiscal/regras-validacao`
  - `POST /api/empresas/:empresaId/fiscal/validar-documento`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/validacaoFiscalDuplicidades.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/ValidacaoFiscalModel.ts`.
- [x] Criar repositório em `src/repositories/ValidacaoFiscalRepository.ts`.
- [x] Implementar `ValidacaoFiscalService` em `src/services/ValidacaoFiscalService.ts`.
- [x] Implementar `ValidacaoFiscalController` e `validacaoFiscalRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/validacaoFiscalDuplicidades.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.1` (`IDocumentoFiscalImportadoRepository`) e `SPEC-3.2` (`INotaFiscalRepository`).

## 9. Como validar
1. Executar `npx jest tests/validacaoFiscalDuplicidades.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/39
- Modelos, repositório, serviço, controller e rotas em `src/models/ValidacaoFiscalModel.ts`, `src/repositories/ValidacaoFiscalRepository.ts`, `src/services/ValidacaoFiscalService.ts`, `src/controllers/ValidacaoFiscalController.ts` e `src/routes/validacaoFiscalRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/validacaoFiscalDuplicidades.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
