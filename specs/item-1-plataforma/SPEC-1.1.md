# SPEC-1.1 – Repositório, documentação e padrões de contribuição

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 1 – Plataforma | @joaovitor-webdev | A definir | A definir | Fazendo |

## 1. Contexto e objetivo
Estabelecer a base estrutural, o versionamento e os padrões de documentação e contribuição do repositório do projeto, garantindo conformidade com a metodologia Spec-Driven Development (SDD) e assegurando a integridade e governança da branch `main`.

## 2. Requisitos relacionados
- **RNF-011 — Manutenibilidade**: código versionado, revisões, documentação, testes automatizados, migrações controladas e ambientes separados.

## 3. Escopo
- **Dentro do escopo:**
  - Disponibilização dos arquivos essenciais de documentação e governança na raiz: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.
  - Estruturação do diretório de especificações `specs/`, incluindo a pasta de modelos `specs/_modelo/` e os subdiretórios dos itens do projeto.
  - Definição das regras de proteção para a branch `main` (bloqueio de push direto e exigência de revisão via Pull Request).
- **Fora do escopo:**
  - Implementação de código de regras de negócio contábeis, fiscais ou de folha.
  - Configuração de pipelines de CI/CD para deploy em ambientes de homologação/produção (pertencente a specs subsequentes de infraestrutura/deploy).
  - Execução de testes automatizados ou migrações de banco de dados nesta etapa.

## 4. Comportamento esperado
- **Fluxo normal:** Um desenvolvedor consulta as instruções de contribuição no `CONTRIBUTING.md`, clona o repositório, utiliza os modelos de especificação em `specs/_modelo/`, cria uma branch baseada na convenção e submete alterações exclusivamente por meio de Pull Request direcionado à branch `main`.
- **Fluxo de restrição/erro:** Um desenvolvedor tenta realizar um commit ou push direto na branch `main` e a operação é rejeitada pelas regras de proteção da branch, exigindo a abertura de um Pull Request com aprovação de revisão.

## 5. Critérios de aceite
- **CA-1:** Dado o repositório Git do projeto, quando verificada a branch `main`, então os arquivos `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, a pasta `specs/` e o modelo `specs/_modelo/SPEC-MODELO.md` devem estar versionados e presentes.
- **CA-2:** Dado o repositório remoto no GitHub, quando qualquer colaborador tentar realizar um push direto na branch `main`, então a ação deve ser bloqueada pelas regras de proteção de branch do repositório.
- **CA-3:** Dado um Pull Request aberto direcionado à branch `main`, quando avaliado para merge, então ele deve exigir revisão e aprovação antes de ser incorporado à branch principal.

## 6. Plano técnico
- **Estrutura de arquivos:**
  - Manter na raiz: `README.md` (visão geral do projeto), `CONTRIBUTING.md` (guia SDD, branches, commits e PRs), `CHANGELOG.md` (registro de alterações).
  - Manter a estrutura de diretórios em `specs/` (`item-1-plataforma/`, `item-2-contabilidade/`, `item-3-fiscal-ir/`, `item-4-folha-atendimento/`, `item-5-experiencia-integracoes/` e `_modelo/SPEC-MODELO.md`).
- **Governança do repositório:**
  - Configurar regra de Branch Protection Rule no GitHub para a branch `main`:
    - Ativar "Require a pull request before merging" (exigindo aprovação).
    - Desativar permissões de bypass para commits diretos.

## 7. Tarefas de implementação
- [x] Criar branch de trabalho seguindo o padrão (`spec/1.1-repositorio-documentacao-padroes`)
- [x] Validar a presença e consistência dos arquivos `README.md`, `CONTRIBUTING.md` e `CHANGELOG.md` na raiz
- [x] Validar a presença da estrutura `specs/` e do modelo `specs/_modelo/SPEC-MODELO.md`
- [x] Criar a especificação SPEC-1.1 preenchida em `specs/item-1-plataforma/SPEC-1.1.md`
- [x] Configurar regras de proteção da branch `main` no repositório GitHub
- [x] Atualizar `CHANGELOG.md` na seção `[Não lançado]`
- [ ] Abrir Pull Request com o template padrão para validação do 4º período

## 8. Dependências
Nenhuma (spec fundacional).

## 9. Como validar
1. **Validação dos arquivos e estrutura (CA-1):**
   - Clonar ou acessar o repositório na branch `main`.
   - Executar inspeção de arquivos na raiz e verificar a existência de `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.
   - Verificar a existência do diretório `specs/` contendo `_modelo/SPEC-MODELO.md`.
2. **Validação da proteção da branch `main` (CA-2 e CA-3):**
   - No GitHub CLI, executar: `gh api repos/joaovitor-webdev/pagamentus/branches/main/protection`
   - Verificar se `required_pull_request_reviews` possui `required_approving_review_count: 1`.
   - Confirmar se `allow_force_pushes` e `allow_deletions` estão como `false`.

## 10. Evidências (preencher ao concluir)
- **CA-1 (Estrutura e documentação):** Arquivos `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md` presentes na raiz e estrutura `specs/` com modelo oficial preservada.
- **CA-2 e CA-3 (Proteção da main e exigência de revisão):**
  - Configuração ativa no GitHub (`GET /repos/joaovitor-webdev/pagamentus/branches/main/protection`):
    ```json
    {
      "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": false
      },
      "allow_force_pushes": { "enabled": false },
      "allow_deletions": { "enabled": false }
    }
    ```

## 11. Histórico de revisão
*Nenhuma ressalva registrada até o momento.*

