# SPEC-3.22 – IRPJ: memória de apuração e obrigações digitais

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **memória de apuração de IRPJ/CSLL conciliada com a contabilidade, o vínculo com documentação de suporte e a preparação de dados estruturados para obrigações digitais** (ex.: ECF / ECD) respeitando a versão de leiaute informada para o exercício.

## 2. Requisitos relacionados
- **RF-044:** Manter memória de apuração, conciliação com a contabilidade e documentação de suporte.
- **RF-045:** Preparar dados para obrigações digitais aplicáveis, respeitando leiautes e versões oficiais vigentes.

## 3. Escopo
- **Dentro do escopo:**
  - Registro de **memória de apuração IRPJ/CSLL** vinculada à empresa e competência, contendo base de cálculo, alíquota, imposto apurado, valor contabilizado, indicador de conciliação (`conciliado: true/false` e `diferencaContabil`) e lista de documentos de suporte.
  - Geração de **pacote estruturado para obrigação digital** (ex.: `ECF`, `ECD`, `DCTF`) vinculada à versão de leiaute vigente informada (`leiauteVersao`) e exercício, com aviso de arquivo de preparação/demonstração (sem transmissão automática).
- **Fora do escopo:**
  - Assinatura digital com certificado A1/A3 e transmissão direta ao PVA/SPED da Receita Federal.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra a memória de apuração com valores apurados, valor contabilizado e referências de documentos de suporte; o sistema verifica automaticamente a conciliação contábil.
  - O usuário solicita a preparação dos dados da obrigação digital informando o tipo (`ECF`, `ECD`, `DCTF`), exercício e `leiauteVersao`; o sistema monta o payload estruturado respeitando a versão do leiaute.
- **Fluxo de erro/exceção:**
  - Se faltarem campos obrigatórios, `leiauteVersao` estiver vazia, tipo de obrigação for inválido ou valores forem negativos, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Memória de apuração, conciliação contábil e documentação de suporte):** Dada uma empresa e competência, quando a memória de apuração for registrada com base, imposto apurado, valor contabilizado e documentos de suporte, então o sistema deve gravar a memória e indicar se está conciliada com a contabilidade e eventual diferença (`RF-044`).
- **CA-2 (Preparação de dados para obrigações digitais com versão de leiaute):** Dada uma memória de apuração existente, quando for solicitada a preparação de obrigação digital (`ECF`, `ECD` ou `DCTF`) com exercício e `leiauteVersao`, então o sistema deve gerar os registros estruturados com a versão do leiaute especificada (`RF-045`).
- **CA-3 (Validações de entrada):** Dados tipo de obrigação inválido, `leiauteVersao` ausente ou valores negativos, o sistema deve recusar com HTTP 400 (`RF-044`, `RF-045`).

## 6. Plano técnico
- **Modelos (`src/models/IrpjObrigacoesDigitaisModel.ts`):** `MemoriaApuracaoIrpj`, `TipoObrigacaoDigitalIrpj` e `PacoteObrigacaoDigitalIrpj`.
- **Serviço (`src/services/IrpjObrigacoesDigitaisService.ts`):** Registro/listagem de memória de apuração com conciliação contábil e geração de pacote de obrigação digital versionado.
- **Controller e Rotas (`src/controllers/IrpjObrigacoesDigitaisController.ts` e `src/routes/irpjObrigacoesDigitaisRoutes.ts`):**
  - `POST /api/empresas/:empresaId/irpj-csll/memorias`
  - `GET /api/empresas/:empresaId/irpj-csll/memorias`
  - `POST /api/empresas/:empresaId/irpj-csll/obrigacoes-digitais`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/irpjMemoriaObrigacoesDigitais.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/IrpjObrigacoesDigitaisModel.ts`.
- [x] Implementar `IrpjObrigacoesDigitaisService` em `src/services/IrpjObrigacoesDigitaisService.ts`.
- [x] Implementar `IrpjObrigacoesDigitaisController` e `irpjObrigacoesDigitaisRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/irpjMemoriaObrigacoesDigitais.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.21` (base e ajustes de IRPJ/CSLL).

## 9. Como validar
1. Executar `npx jest tests/irpjMemoriaObrigacoesDigitais.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/IrpjObrigacoesDigitaisModel.ts`, `src/services/IrpjObrigacoesDigitaisService.ts`, `src/controllers/IrpjObrigacoesDigitaisController.ts` e `src/routes/irpjObrigacoesDigitaisRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/irpjMemoriaObrigacoesDigitais.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
