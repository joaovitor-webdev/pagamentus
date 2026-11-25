# SPEC-3.7 – Cálculo e memória de cálculo

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/CuSU54R9 | Feito |

## 1. Contexto e objetivo
Esta especificação define o **motor de cálculo tributário parametrizado e a geração de memória de cálculo detalhada e reproduzível** para tributos federais, estaduais e municipais, considerando regime, atividade, município/UF, período e tipo de operação (com regras parametrizadas de demonstração, sem caráter de tabela oficial).

## 2. Requisitos relacionados
- **RF-020:** Calcular tributos com regras parametrizadas por regime, atividade, município/UF, período e tipo de operação.
- **RF-021:** Demonstrar memória de cálculo, base, alíquota, deduções, retenções, créditos e arredondamentos.
- **RF-027:** Calcular tributos federais, estaduais e municipais conforme aplicabilidade e regras vigentes cadastradas.
- **RNF-012:** Confiabilidade dos cálculos: usar regras versionadas, testes com casos de referência, arredondamento documentado e memória de cálculo reproduzível.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro/parametrização de regras versionadas de cálculo por esfera (`FEDERAL`, `ESTADUAL`, `MUNICIPAL`), tributo, regime, atividade, município/UF, período de vigência e tipo de operação.
  - Execução de cálculo tributário sobre uma operação informada, selecionando as regras vigentes aplicáveis às esferas pertinentes.
  - Retorno de memória de cálculo completa e reproduzível por tributo, explicitando: versão da regra aplicada, base de cálculo, alíquota, deduções, retenções, créditos, método de arredondamento documentado (`HALF_UP` para 2 casas decimais) e valor final.
- **Fora do escopo:**
  - Tabelas oficiais pré-carregadas da Receita Federal, SEFAZ ou prefeituras.
  - Emissão de guias de recolhimento (DARF/DAS/GNRE/ISS) ou transmissão de declarações.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário parametriza regras versionadas de tributos (federais, estaduais e/ou municipais) para determinado regime, atividade, município/UF, vigência e tipo de operação.
  - Ao solicitar o cálculo de uma operação informando regime, atividade, município/UF, data/período, tipo de operação, valor bruto e eventuais deduções, retenções e créditos, o sistema aplica as regras vigentes compatíveis e retorna os tributos calculados com memória de cálculo detalhada, regra/versão usada e critério de arredondamento.
  - Executando o mesmo cenário com as mesmas regras e entradas, o sistema produz exatamente o mesmo resultado e memória de cálculo.
- **Fluxo de erro/exceção:**
  - Se faltarem parâmetros obrigatórios, houver valores negativos inválidos, data/período inválido ou vigência invertida no cadastro de regra, o sistema recusa a operação (HTTP 400).
  - Se não houver regra vigente aplicável ao cenário consultado, o sistema recusa o cálculo informando explicitamente o motivo (HTTP 404).

## 5. Critérios de aceite
- **CA-1 (Cálculo parametrizado por contexto e esfera tributária):** Dadas regras vigentes cadastradas para tributos federais, estaduais e municipais por regime, atividade, município/UF, período e tipo de operação, quando um cálculo for executado para um cenário compatível, então o sistema deve calcular apenas os tributos aplicáveis conforme as regras vigentes (`RF-020`, `RF-027`).
- **CA-2 (Memória de cálculo completa):** Dado um cálculo executado com base, alíquota, deduções, retenções, créditos e regra versionada, quando o resultado for retornado, então a memória de cálculo deve demonstrar explicitamente base de cálculo, alíquota, deduções, retenções, créditos, regra de arredondamento aplicada e valor calculado (`RF-021`, `RNF-012`).
- **CA-3 (Reprodutibilidade e confiabilidade com versão e arredondamento):** Dado o mesmo cenário de entrada e as mesmas versões de regras vigentes, quando o cálculo for executado repetidas vezes (inclusive após atualização para nova versão de regra mantendo histórico), então o mesmo cenário deve produzir exatamente o mesmo resultado e memória de cálculo reproduzível com arredondamento documentado (`RNF-012`).
- **CA-4 (Validações e recusa sem regra vigente):** Dados parâmetros inválidos (valor bruto inválido, deduções/retenções/créditos negativos, vigência invertida ou formato de data inválido) ou ausência de regra vigente compatível para o cenário, quando o cadastro ou cálculo for solicitado, então o sistema deve recusar a operação com mensagem explicativa (`RF-020`, `RF-027`).

## 6. Plano técnico
- **Modelos (`src/models/CalculoTributarioModel.ts`):** Definição de `EsferaTributaria`, `RegraCalculoTributario`, `EntradaCalculoTributario`, `MemoriaCalculoTributo` e `ResultadoCalculoMemoria`.
- **Repositório (`src/repositories/CalculoTributarioRepository.ts`):** `ICalculoTributarioRepository` e `InMemoryCalculoTributarioRepository` para armazenar regras versionadas de cálculo e histórico de memórias geradas.
- **Serviço (`src/services/CalculoTributarioService.ts`):** Parametrização versionada de regras, seleção por regime/atividade/município/UF/período/tipo de operação, cálculo com arredondamento `HALF_UP` (2 casas decimais) e geração determinística da memória de cálculo.
- **Controller e Rotas (`src/controllers/CalculoTributarioController.ts` e `src/routes/calculoTributarioRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/calculo-regras` — Cadastrar regra versionada de cálculo.
  - `POST /api/empresas/:empresaId/fiscal/calculos` — Executar cálculo e retornar memória de cálculo detalhada.
  - `GET /api/empresas/:empresaId/fiscal/calculos` — Listar memórias de cálculo geradas.
- **Integração (`src/app.ts`):** Registrar repositório, serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/calculoMemoria.test.ts`):** Casos de referência cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/CalculoTributarioModel.ts`.
- [x] Criar repositório em `src/repositories/CalculoTributarioRepository.ts`.
- [x] Implementar `CalculoTributarioService` em `src/services/CalculoTributarioService.ts`.
- [x] Implementar `CalculoTributarioController` e `calculoTributarioRoutes` e registrar em `src/app.ts`.
- [x] Criar testes de referência em `tests/calculoMemoria.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.5` e `SPEC-3.6` (reaproveitamento do conceito de regras versionadas e regimes tributários).

## 9. Como validar
1. Executar `npx jest tests/calculoMemoria.test.ts` e confirmar aprovação de todos os cenários (`CA-1` a `CA-4`).
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, repositório, serviço, controller e rotas em `src/models/CalculoTributarioModel.ts`, `src/repositories/CalculoTributarioRepository.ts`, `src/services/CalculoTributarioService.ts`, `src/controllers/CalculoTributarioController.ts` e `src/routes/calculoTributarioRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/calculoMemoria.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/43

## 11. Histórico de revisão
- Ainda sem revisões registradas.
