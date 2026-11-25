# SPEC-4.11 – Acesso, retenção e consentimentos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento | @doug26-cmyk | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **controle de acesso, download, compartilhamento, política de retenção/descarte documental** e o **registro de consentimentos, autorizações e procurações** por cliente, com aviso explícito de que o registro não substitui análise jurídica.

## 2. Requisitos relacionados
- **RF-069:** Controlar acesso, download, compartilhamento, prazo de retenção e descarte conforme política aprovada.
- **RF-070:** Registrar consentimentos, autorizações e procurações quando necessários, sem substituir análise jurídica.

## 3. Escopo
- **Dentro do escopo:**
  - Registro de política de acesso e retenção por documento (`perfisPermitidos`, `permiteDownload`, `permiteCompartilhamento`, `retencaoAte`) e execução de ações controladas (`DOWNLOAD`, `COMPARTILHAMENTO`, `DESCARTE`), bloqueando ações não permitidas ou descarte antes do prazo de retenção (HTTP 403/400).
  - Registro de `CONSENTIMENTO`, `AUTORIZACAO` e `PROCURACAO` vinculados ao cliente, com validade, status (`ATIVO`, `REVOGADO`) e aviso de que o registro não substitui análise jurídica.
- **Fora do escopo:**
  - Assinatura eletrônica qualificada ICP-Brasil ou validação jurídica automática de procurações.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário define a política de acesso/retenção de um documento e solicita download, compartilhamento ou descarte após o vencimento do prazo de retenção.
  - O usuário registra consentimentos, autorizações e procurações do cliente e pode consultá-los ou revogá-los.
- **Fluxo de erro/exceção:**
  - Tentativa de download/compartilhamento por perfil não autorizado ou quando a política proíbe retorna HTTP 403.
  - Tentativa de descarte antes da data `retencaoAte` retorna HTTP 400.

## 5. Critérios de aceite
- **CA-1 (Controle de acesso, download, compartilhamento e retenção/descarte):** Dada uma política documental com `perfisPermitidos`, flags de download/compartilhamento e `retencaoAte`, quando um perfil não autorizado tentar baixar/compartilhar ou quando o descarte for solicitado antes de `retencaoAte`, então o sistema deve bloquear a ação; após `retencaoAte`, deve permitir o descarte (`RF-069`).
- **CA-2 (Registro de consentimentos, autorizações e procurações):** Dado um cliente, quando forem registrados consentimentos, autorizações ou procurações, então o sistema deve armazená-los com aviso de que não substituem análise jurídica e permitir consulta/revogação (`RF-070`).
- **CA-3 (Validações):** Dados campos obrigatórios ausentes ou tipo inválido, o sistema deve recusar com HTTP 400 (`RF-069`, `RF-070`).

## 6. Plano técnico
- **Modelos (`src/models/AcessoRetencaoConsentimentoModel.ts`):** `PoliticaDocumentoCliente`, `TipoTermoCliente` e `RegistroConsentimentoCliente`.
- **Serviço (`src/services/AcessoRetencaoConsentimentoService.ts`):** Controle de acesso/retenção/descarte e gestão de consentimentos/procurações.
- **Controller e Rotas (`src/controllers/AcessoRetencaoConsentimentoController.ts` e `src/routes/acessoRetencaoConsentimentoRoutes.ts`):**
  - `POST /api/portal/clientes/:clienteId/politicas-documentos`
  - `POST /api/portal/clientes/:clienteId/politicas-documentos/:docId/acao`
  - `POST /api/portal/clientes/:clienteId/consentimentos`
  - `GET /api/portal/clientes/:clienteId/consentimentos`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/acessoRetencaoConsentimentos.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/AcessoRetencaoConsentimentoModel.ts`.
- [x] Implementar `AcessoRetencaoConsentimentoService` em `src/services/AcessoRetencaoConsentimentoService.ts`.
- [x] Implementar `AcessoRetencaoConsentimentoController` e `acessoRetencaoConsentimentoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/acessoRetencaoConsentimentos.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-4.9` e `SPEC-4.10`.

## 9. Como validar
1. Executar `npx jest tests/acessoRetencaoConsentimentos.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/AcessoRetencaoConsentimentoModel.ts`, `src/services/AcessoRetencaoConsentimentoService.ts`, `src/controllers/AcessoRetencaoConsentimentoController.ts` e `src/routes/acessoRetencaoConsentimentoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/acessoRetencaoConsentimentos.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
