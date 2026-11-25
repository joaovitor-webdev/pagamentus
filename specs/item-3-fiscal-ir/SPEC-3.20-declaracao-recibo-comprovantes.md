# SPEC-3.20 – Declaração, recibo e comprovantes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **armazenamento seguro e com acesso restrito de documentos da declaração de IRPF** (declaração, recibo de entrega, cópia transmitida e comprovantes fornecidos pelo cliente), garantindo integridade via hash SHA-256 e controle de permissão no acesso.

## 2. Requisitos relacionados
- **RF-039:** Armazenar declaração, recibo, cópia transmitida e comprovantes fornecidos pelo cliente com acesso restrito.

## 3. Escopo
- **Dentro do escopo:**
  - Armazenamento de documentos vinculados à declaração (`fichaId`) nos tipos: `DECLARACAO`, `RECIBO`, `COPIA_TRANSMITIDA` e `COMPROVANTE_CLIENTE`, registrando nome do arquivo, conteúdo/referência, hash SHA-256 e lista de perfis autorizados (`CONTADOR`, `TITULAR_CLIENTE`, `AUDITOR`).
  - Consulta/download restrito dos documentos exigindo cabeçalho/perfil autorizado (`x-perfil-acesso`), recusando perfis não autorizados com HTTP 403.
- **Fora do escopo:**
  - Armazenamento externo em S3/GCS ou criptografia por KMS externo.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário armazena a declaração, recibo, cópia transmitida ou comprovante do cliente; o sistema calcula o hash SHA-256 e grava com controle de acesso restrito.
  - Usuários com perfil autorizado conseguem listar e consultar os documentos armazenados da declaração.
- **Fluxo de erro/exceção:**
  - Tentativa de acesso sem perfil autorizado retorna HTTP 403.
  - Tipo de documento inválido ou campos obrigatórios ausentes retornam HTTP 400.

## 5. Critérios de aceite
- **CA-1 (Armazenamento de declaração, recibo, cópia transmitida e comprovantes):** Dada uma declaração (`fichaId`), quando documentos dos tipos `DECLARACAO`, `RECIBO`, `COPIA_TRANSMITIDA` ou `COMPROVANTE_CLIENTE` forem armazenados, então o sistema deve persisti-los com hash SHA-256 e metadados (`RF-039`).
- **CA-2 (Controle de acesso restrito):** Dados documentos armazenados, quando um usuário com perfil autorizado (`CONTADOR`, `TITULAR_CLIENTE`, `AUDITOR`) consultar a declaração, deve obter os documentos; quando um perfil não autorizado tentar acessar, o sistema deve bloquear com HTTP 403 (`RF-039`).
- **CA-3 (Validações de entrada):** Dado tipo de documento inválido ou conteúdo vazio, o sistema deve recusar o armazenamento com HTTP 400 (`RF-039`).

## 6. Plano técnico
- **Modelos (`src/models/DocumentoDeclaracaoIrModel.ts`):** `TipoDocumentoIr` e `DocumentoDeclaracaoIr`.
- **Serviço (`src/services/DocumentoDeclaracaoIrService.ts`):** Armazenamento com SHA-256 e consulta condicionada a perfil autorizado.
- **Controller e Rotas (`src/controllers/DocumentoDeclaracaoIrController.ts` e `src/routes/documentoDeclaracaoIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/documentos`
  - `GET /api/ir/fichas/:fichaId/documentos`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/declaracaoReciboComprovantesIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/DocumentoDeclaracaoIrModel.ts`.
- [x] Implementar `DocumentoDeclaracaoIrService` em `src/services/DocumentoDeclaracaoIrService.ts`.
- [x] Implementar `DocumentoDeclaracaoIrController` e `documentoDeclaracaoIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/declaracaoReciboComprovantesIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13` (referência a `fichaId`).

## 9. Como validar
1. Executar `npx jest tests/declaracaoReciboComprovantesIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/DocumentoDeclaracaoIrModel.ts`, `src/services/DocumentoDeclaracaoIrService.ts`, `src/controllers/DocumentoDeclaracaoIrController.ts` e `src/routes/documentoDeclaracaoIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/declaracaoReciboComprovantesIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/67

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
