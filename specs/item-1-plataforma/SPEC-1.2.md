# SPEC-1.2 – Arquitetura, stack e ambientes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 1 – Plataforma | @joaovitor-webdev | A definir | A definir | Fazendo |

## 1. Contexto e objetivo
Definir a arquitetura tecnológica, a stack oficial de desenvolvimento e a estratégia de segregação de ambientes do projeto por meio de um registro de decisão arquitetural (ADR). O objetivo é garantir capacidade de escalabilidade para suportar o crescimento da aplicação e assegurar o isolamento estrito entre o ambiente de testes/desenvolvimento e o ambiente de produção.

## 2. Requisitos relacionados
- **RF-079**: Manter ambiente de testes separado do ambiente de produção.
- **RNF-007 — Escalabilidade**: Suportar crescimento de clientes, documentos, lançamentos e usuários sem degradação inaceitável.

## 3. Escopo
- **Dentro do escopo:**
  - Elaboração de Architecture Decision Record (`docs/arquitetura/ADR-001-stack-e-ambientes.md`) detalhando a stack escolhida (backend, frontend, banco de dados, containerização) e suas justificativas frente à escalabilidade.
  - Especificação e documentação formal do isolamento entre ambiente de teste/desenvolvimento e ambiente de produção (bancos de dados isolados, configurações via variáveis de ambiente e regras de acesso).
  - Atualização do arquivo de variáveis de ambiente modelo (`.env.example`) refletindo a separação e parâmetros necessários por ambiente.
- **Fora do escopo:**
  - Provisionamento de infraestrutura em nuvem paga ou criação de clusters de produção nesta etapa.
  - Implementação de código de regras de negócio de domínios contábeis, fiscais ou folha de pagamento.
  - Implementação de testes de carga e estresse (pertencente às specs de validação de qualidade/performance).

## 4. Comportamento esperado
- **Fluxo normal (Separação de ambientes):** Ao executar testes ou desenvolver novas funcionalidades, o sistema conecta-se exclusivamente a instâncias de banco de dados e serviços designados para teste/desenvolvimento, sem compartilhamento de dados ou interferência nos dados de produção.
- **Fluxo de restrição/erro:** Tentativas de executar rotinas de teste utilizando variáveis ou credenciais apontando para a base de produção devem ser impedidas por validação de ambiente (`APP_ENV` / configurações de conexão), evitando corrupção ou contaminação de dados.

## 5. Critérios de aceite
- **CA-1:** Dado o diretório `docs/arquitetura/`, quando inspecionado, então deve existir o documento `ADR-001-stack-e-ambientes.md` contendo a stack tecnológica selecionada, as justificativas técnicas e a estratégia para atender ao requisito de escalabilidade (RNF-007).
- **CA-2:** Dado o documento `ADR-001-stack-e-ambientes.md` e a documentação do projeto, quando verificada a seção de ambientes, então deve haver a especificação detalhada da separação entre ambiente de testes e ambiente de produção (RF-079), abrangendo isolamento de banco de dados, variáveis de ambiente e fluxo de execução.
- **CA-3:** Dado o arquivo `.env.example`, quando analisado, então deve conter a parametrização necessária para segregação de ambientes (`APP_ENV` ou equivalente) com exemplos distintos para execução em modo de teste e em produção, utilizando exclusivamente dados fictícios.

## 6. Plano técnico
- **Documentação de Arquitetura:**
  - Criar `docs/arquitetura/ADR-001-stack-e-ambientes.md` estruturado com: Título, Data, Status, Contexto, Decisão (Stack, Escalabilidade e Segregação de Ambientes) e Consequências.
  - Definir stack modular e escalável:
    - Backend: Node.js (TypeScript) com Express ou NestJS / Python FastAPI (definido no ADR).
    - Banco de Dados: PostgreSQL com suporte a isolamento por esquemas/multi-inquilino.
    - Ambientes: Separação física/lógica de bancos (`pagamentus_test` e `pagamentus_prod`), flags de ambiente (`NODE_ENV` / `APP_ENV`) e containerização via Docker Compose.
- **Configuração de Ambientes:**
  - Atualizar `.env.example` para contemplar as chaves de configuração dos ambientes separados.

## 7. Tarefas de implementação
- [x] Criar branch de trabalho `spec/1.2-decisao-stack` a partir da `main`
- [x] Criar especificação `specs/item-1-plataforma/SPEC-1.2.md`
- [x] Elaborar `docs/arquitetura/ADR-001-stack-e-ambientes.md` com stack, justificativas e segregação de ambientes
- [x] Atualizar `.env.example` com as configurações de ambientes separados
- [x] Atualizar `CHANGELOG.md` na seção `[Não lançado]`
- [ ] Abrir Pull Request com o template oficial para validação do 4º período

## 8. Dependências
- `SPEC-1.1` (Repositório, documentação e padrões de contribuição).

## 9. Como validar
1. **Validação do ADR e Escalabilidade (CA-1):**
   - Verificar a existência do arquivo `docs/arquitetura/ADR-001-stack-e-ambientes.md`.
   - Ler o documento e confirmar a presença da justificativa técnica da stack e os pilares de escalabilidade alinhados ao RNF-007.
2. **Validação da Separação de Ambientes (CA-2):**
   - Verificar no ADR a seção dedicada ao RF-079 comprovando a distinção entre bancos de dados, chaves e serviços de teste vs. produção.
3. **Validação das Variáveis de Ambiente (CA-3):**
   - Inspecionar `.env.example` e verificar as variáveis de controle de ambiente e conexões segregadas com dados 100% fictícios.

## 10. Evidências (preencher ao concluir)
- **CA-1 (ADR e Escalabilidade):** Arquivo `docs/arquitetura/ADR-001-stack-e-ambientes.md` criado, detalhando Node.js (TypeScript), PostgreSQL, Express/Fastify e estratégias de escala horizontal (stateless, JWT, filas assíncronas).
- **CA-2 (Separação de Ambientes):** Seção 2.3 do `ADR-001-stack-e-ambientes.md` documenta isolamento estrito de bases (`pagamentus_test` vs `pagamentus_prod`), flags de ambiente (`NODE_ENV`) e mocks para serviços externos.
- **CA-3 (Variáveis segregadas):** Arquivo `.env.example` atualizado com seções explícitas de controle de ambiente (`NODE_ENV`), conexões de banco separadas para teste e produção, e flags de mock sem expor dados reais.

## 11. Histórico de revisão
*Nenhuma ressalva registrada até o momento.*

