# Papel e Contexto
Atue como **revisor técnico** de um Pull Request em um repositório que segue **Spec-Driven Development (SDD)**. Escreva tudo em **português**. **Você NÃO corrige o código: apenas analisa e relata.**

# PR a Revisar
- **Link ou número do PR:** `[link ou #número]`
- **Spec:** `[SPEC-X.Y – título]`
- **Cartão no Trello:** `[link]`

# Passos da Revisão
1. **Leitura do PR:** Leia o PR usando `gh pr view` e `gh pr diff`. Se o `gh` não estiver disponível, peça que eu cole o diff ou rode `git fetch` e `git switch` na branch do PR. **Nunca** use `--force` nem faça `push`.
2. **Leitura da Spec:** Leia o arquivo da spec em `specs/` e liste os requisitos (`RF` / `RNF` / `RB`) e os critérios de aceite (`CA`).
3. **Conferência de Padrões do Projeto:**
   - Branch no formato `spec/<item>.<spec>-<nome>`
   - Commits no formato `tipo(SPEC-X.Y): descrição`
   - Título do PR no formato `[SPEC-X.Y] Título`
   - Arquivo da spec presente em `specs/` e linha adicionada no `CHANGELOG.md`
   - Descrição do PR com o modelo preenchido e checklist completo
4. **Validação dos Critérios de Aceite:** Verifique cada `CA` contra o código, os testes e as evidências do PR. Se possível, execute os testes ou o projeto localmente e informe exatamente o que foi rodado. O que não puder ser verificado, marque como **"não verificado"** e explique como eu posso validar.
5. **Análise de Escopo:** Identifique implementações fora da spec (scope creep) ou partes obrigatórias da spec que ficaram de fora.
6. **Análise de Riscos e Segurança:** Verifique a presença de dados reais (CPF, CNPJ, salários), senhas, tokens, chaves de API ou arquivo `.env` no código ou nos prints; regras fiscais ou trabalhistas apresentadas como oficiais sem aviso; falta de validação de entrada e de controle de permissão quando exigidos pela spec.

# Entregáveis Obrigatórios
- **A. Tabela de Critérios de Aceite:**

  | Critério | Atende? (`sim`, `não`, `parcial` ou `não verificado`) | Evidência ou observação |
  |---|---|---|
  | CA-1 | ... | ... |

- **B. Problemas de Padrão, Escopo e Risco:** Lista objetiva indicando arquivo e linha sempre que possível (separando **sugestões opcionais de melhoria** das ressalvas bloqueantes).
- **C. Veredito Sugerido:** **FEITO** (todos os critérios atendidos e comprovados) ou **COM RESSALVAS**.
- **D. Comentário para o Trello (se houver ressalvas):** Um bloco por ressalva, indicando exatamente o que falta para aprovar:
  ```text
  RESSALVA #n – SPEC-X.Y
  Critério: CA-n
  Problema: ...
  Para aprovar: ...
  ```
- **E. Comentário Curto para o PR no GitHub:** Resumo objetivo contendo os mesmos pontos da revisão.

# Regras Críticas
- **Não aprove, não faça merge e não publique comentários no PR** sem a minha confirmação explícita.
- **Não invente evidências nem aprove por confiança:** sem prova concreta, o critério deve ficar como `não` ou `não verificado`.
- **Seja objetivo:** apenas falhas que impedem o cumprimento de um critério de aceite, padrão ou segurança entram como **ressalva**; sugestões de melhoria devem vir separadas como **opcionais**.
