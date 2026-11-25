# SPEC-3.13 – Ficha do contribuinte e dependentes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **cadastro da ficha do contribuinte pessoa física para Imposto de Renda** (dados pessoais, ocupação, endereço, dados bancários opcionais, alimentandos e dependentes) com **controle de duplicidade de dependentes** no mesmo exercício fiscal.

## 2. Requisitos relacionados
- **RF-030:** Criar ficha do contribuinte com dados pessoais, dependentes, alimentandos, ocupação, endereço e dados bancários quando necessários.
- **RF-034:** Controlar dependentes e evitar duplicidade de inclusão em declarações quando identificada.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro e consulta da ficha do contribuinte por exercício fiscal (`exercicio`), contendo: identificador/documento fictício, nome completo, data de nascimento, ocupação, endereço, dados bancários opcionais, lista de alimentandos e lista de dependentes.
  - Inclusão de dependentes vinculados à ficha do contribuinte (com documento identificador, nome, grau de parentesco e data de nascimento).
  - Detecção e bloqueio de duplicidade de dependente (mesmo documento identificador já vinculado à mesma ficha ou a outra declaração no mesmo exercício fiscal).
- **Fora do escopo:**
  - Validação online de CPF na Receita Federal.
  - Cálculo de dedução por dependente (tratado na SPEC-3.14 / SPEC-3.17).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cria a ficha do contribuinte para um exercício informando dados pessoais, ocupação, endereço, dados bancários (se aplicável), alimentandos e dependentes iniciais.
  - O usuário pode adicionar novos dependentes à ficha e consultar a ficha cadastrada.
- **Fluxo de erro/exceção:**
  - Se houver tentativa de incluir um dependente cujo documento identificador já esteja registrado na mesma declaração ou em outra declaração do mesmo exercício, o sistema bloqueia a inclusão (HTTP 409) informando a duplicidade identificada.
  - Se faltarem campos obrigatórios ou o exercício/data forem inválidos, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Criação da ficha completa do contribuinte):** Dado um exercício válido, quando for criada a ficha do contribuinte com dados pessoais, ocupação, endereço, dados bancários, alimentandos e dependentes, então o sistema deve persistir e retornar a ficha vinculada ao exercício (`RF-030`).
- **CA-2 (Bloqueio de duplicidade de dependente no mesmo exercício):** Dado um dependente já incluído na declaração de um contribuinte no exercício `X`, quando houver tentativa de incluí-lo novamente na mesma declaração ou na declaração de outro contribuinte no mesmo exercício `X`, então o sistema deve recusar a operação (HTTP 409) alertando a duplicidade (`RF-034`).
- **CA-3 (Validações e consulta):** Dados parâmetros obrigatórios ausentes ou inválidos, quando o cadastro for solicitado, então o sistema deve recusar com HTTP 400; e para ficha inexistente deve retornar HTTP 404 (`RF-030`, `RF-034`).

## 6. Plano técnico
- **Modelos (`src/models/FichaContribuinteIrModel.ts`):** `DependenteIr`, `AlimentandoIr`, `EnderecoContribuinte`, `DadosBancariosContribuinte` e `FichaContribuinteIr`.
- **Serviço (`src/services/FichaContribuinteIrService.ts`):** Criação/consulta de fichas, inclusão de dependentes e verificação de duplicidade por documento + exercício.
- **Controller e Rotas (`src/controllers/FichaContribuinteIrController.ts` e `src/routes/fichaContribuinteIrRoutes.ts`):**
  - `POST /api/ir/fichas`
  - `GET /api/ir/fichas/:fichaId`
  - `POST /api/ir/fichas/:fichaId/dependentes`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/fichaContribuinteDependentes.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/FichaContribuinteIrModel.ts`.
- [x] Implementar `FichaContribuinteIrService` em `src/services/FichaContribuinteIrService.ts`.
- [x] Implementar `FichaContribuinteIrController` e `fichaContribuinteIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/fichaContribuinteDependentes.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/fichaContribuinteDependentes.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/FichaContribuinteIrModel.ts`, `src/services/FichaContribuinteIrService.ts`, `src/controllers/FichaContribuinteIrController.ts` e `src/routes/fichaContribuinteIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/fichaContribuinteDependentes.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
