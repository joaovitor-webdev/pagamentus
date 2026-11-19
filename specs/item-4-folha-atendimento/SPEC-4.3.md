# SPEC-4.3 – Portal de documentos do cliente

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento ao cliente | Douglas | A definir | A definir | Fazendo |

## 1. Contexto e objetivo

Permitir que o cliente envie, consulte e organize documentos pelo portal, conforme sua organização e suas solicitações.

## 2. Requisitos relacionados

- RF-066
- RF-067
- RF-068
- RF-069
- RF-070
- RB-008
- RNF-002
- RNF-004

## 3. Escopo

Dentro do escopo:
- Acesso ao portal pelo perfil de cliente.
- Visualização somente dos documentos e solicitações do próprio cliente.
- Upload de documentos.
- Organização por cliente, exercício, competência, tipo e processo.
- Busca e filtros por período, tipo e processo.
- Checklist de documentos solicitados.
- Comentários e pedidos de correção.
- Confirmação de recebimento pelo responsável autorizado.
- Registro das ações realizadas no portal.

Fora do escopo:
- Avaliação jurídica de procurações, consentimentos ou autorizações.
- Descarte automático de documentos.
- Integração com assinatura eletrônica.
- Notificações por e-mail ou mensageria.
- Compartilhamento com clientes não autorizados.
- Transmissão de documentos a órgãos públicos.

## 4. Comportamento esperado

### Fluxo normal
1. O cliente acessa o portal autorizado.
2. O sistema lista apenas os documentos e solicitações da organização autorizada.
3. O cliente envia um documento associado ao exercício, competência, tipo e processo.
4. O documento aparece na lista e no checklist correspondente.
5. O responsável confirma o recebimento e atualiza o status.
6. O cliente visualiza ou faz download somente do que lhe está autorizado.

### Fluxo de correção
1. O responsável identifica um documento como incorreto.
2. O responsável registra comentário e pedido de correção.
3. O status fica aguardando correção e o comentário fica visível ao cliente autorizado.

### Fluxo de erro
1. O cliente tenta acessar documento de outro cliente.
2. O sistema bloqueia o acesso e registra a tentativa.
3. Upload sem metadados obrigatórios é rejeitado com orientação clara.

## 5. Critérios de aceite

- **CA-1:** Dado um cliente autenticado, quando ele abrir o portal, então visualizará somente documentos e solicitações associados ao seu cliente.
- **CA-2:** Dado que um cliente autenticado não possui acesso a outro cliente, quando tentar consultar ou abrir documento de outro cliente, então o sistema bloqueará a ação.
- **CA-3:** Dado um checklist de documentos solicitado ao cliente, quando ele anexar o documento correspondente, então o sistema associará o arquivo à solicitação e ao exercício ou competência aplicável.
- **CA-4:** Dado um documento enviado pelo cliente, quando o responsável autorizado confirmar o recebimento, então o checklist marcará o item como recebido.
- **CA-5:** Dado um documento recebido, quando o responsável solicitar correção e registrar comentário, então o status ficará aguardando correção e o comentário ficará visível ao cliente autorizado.
- **CA-6:** Dado um documento cadastrado, quando o usuário aplicar filtros por cliente, exercício, competência, tipo ou processo, então o resultado exibirá somente documentos correspondentes aos filtros e ao seu acesso.
- **CA-7:** Dado um arquivo enviado com metadados obrigatórios incompletos, quando o cliente confirmar o upload, então o sistema rejeitará a operação e indicará os dados faltantes.
- **CA-8:** Dado um cliente com acesso limitado a determinados documentos, quando tentar fazer download de um documento não autorizado, então o download será bloqueado.
- **CA-9:** Dado um envio, consulta, alteração de checklist ou confirmação de recebimento, quando a ação ocorrer, então o sistema registrará usuário, data, objeto e operação na trilha de auditoria.
- **CA-10:** Dado um consentimento, autorização ou procuração registrado no portal, quando o usuário consultar o documento, então o sistema exibirá os dados do registro sem apresentar que realizou análise jurídica.

## 6. Plano técnico

- Rotas REST em `src/routes/clientDocumentRoutes.ts`.
- Tabelas PostgreSQL: `client_documents`, `client_document_requests` e `client_document_audit`.
- Isolamento por `organization_id` e `client_id`.
- Upload em JSON com arquivo em base64, limitado a 10 MB.
- Endpoints para listar, enviar, baixar, solicitar, confirmar recebimento e solicitar correção.
- Registro das operações relevantes em trilha de auditoria.

## 7. Tarefas de implementação

- [ ] Criar tabela de documentos e solicitações por organização e cliente.
- [ ] Implementar envio e validação de metadados.
- [ ] Implementar listagem com filtros.
- [ ] Implementar download autorizado.
- [ ] Implementar checklist e pedidos de correção.
- [ ] Implementar confirmação de recebimento.
- [ ] Implementar registro de auditoria.
- [ ] Criar testes dos fluxos normal e de erro.

## 8. Dependências

- SPEC-1.3 — Modelo de dados inicial.
- SPEC-1.4 — Usuários, perfis e permissões.
- SPEC-1.5 — Trilha de auditoria básica.
- SPEC-5.1 — Navegação e layout responsivo.

## 9. Como validar

1. Autenticar como cliente com `x-user-role: cliente` e `x-client-id` do cliente.
2. Enviar documento com exercício, competência, tipo e arquivo válido.
3. Consultar documentos próprios e aplicar filtros.
4. Tentar abrir documento de outro cliente e confirmar o bloqueio.
5. Criar solicitação, confirmar recebimento e solicitar correção.
6. Executar `npm test`.

## 10. Evidências

- Link do PR.
- Saída dos testes automatizados.
- Evidência do isolamento entre clientes.
- Evidência dos registros de auditoria.

## 11. Histórico de revisão
