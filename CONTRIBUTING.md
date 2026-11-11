# Guia de Contribuição (CONTRIBUTING)

Bem-vindo ao repositório do **Sistema Integrado de Contabilidade, Fiscal e IR**!
Este projeto adota a metodologia **Spec-Driven Development (SDD)**: nenhuma linha de código entra na branch principal sem uma especificação prévia, critérios de aceite verificáveis e revisão do 4º período.

---

## 1. Ciclo de Desenvolvimento (SDD)

1. **Especificar**: O responsável pela frente duplica `specs/_modelo/SPEC-MODELO.md` na pasta do seu item (`specs/item-X-.../`) e preenche contexto, requisitos relacionados (RF, RNF, RB), escopo e critérios de aceite no formato Dado/Quando/Então.
2. **Planejar**: Descreve a solução técnica resumida (telas, modelos, rotas, regras).
3. **Quebrar em tarefas**: Define o checklist passo a passo de implementação.
4. **Implementar**: Cria uma branch para a spec e desenvolve estritamente o que atende aos critérios de aceite definidos.
5. **Validar & Coletar Evidências**: Testa cada critério de aceite e anexa saídas, logs ou capturas de tela.
6. **Abrir Pull Request**: Abre o PR preenchendo o template oficial e move o cartão no Trello para `Revisando`.
7. **Revisão pelo 4º Período**: O revisor avalia os critérios. Se aprovado, o PR recebe merge na `main` e o cartão vai para `Feito`. Se houver ressalvas, são corrigidas na mesma branch.

---

## 2. Padrão de Branches

Nunca comite diretamente na branch `main`. Crie uma branch específica para cada spec partindo da `main` atualizada:

- **Formato:** `spec/<item>.<spec>-<nome-curto>`
- **Exemplos:**
  - `spec/1.2-decisao-stack`
  - `spec/2.1-plano-de-contas`
  - `spec/3.1-cadastro-documentos-fiscais`
  - `spec/4.1-cadastro-empregados`

---

## 3. Padrão de Mensagens de Commit

Utilizamos commits semânticos vinculados obrigatoriamente ao identificador da spec:

- **Formato:** `tipo(SPEC-X.Y): descrição clara em português`
- **Tipos permitidos:**
  - `feat`: Nova funcionalidade implementada
  - `fix`: Correção de bug ou correção de ressalva de revisão
  - `docs`: Documentação, specs, guias e diagramas
  - `test`: Testes unitários, de integração ou casos de teste
  - `refactor`: Refatoração interna sem alteração de comportamento externo
  - `chore`: Configurações de ambiente, dependências ou scripts auxiliares
- **Exemplos:**
  - `docs(SPEC-1.1): cria estrutura base do repositorio`
  - `feat(SPEC-2.1): implementa modelo e validacao de contas analiticas`
  - `fix(SPEC-2.2): bloqueia lancamento desbalanceado em partidas dobradas`

---

## 4. Diretrizes para Pull Requests (PR)

- **Título do PR:** `[SPEC-X.Y] Nome da Spec` (Exemplo: `[SPEC-2.1] Plano de contas`)
- **Obrigatório em todo PR:**
  1. Arquivo da spec correspondente em `specs/item-X-.../`
  2. Implementação do código e testes associados
  3. Atualização do `CHANGELOG.md` na seção `[Não lançado]`
  4. Template `.github/pull_request_template.md` devidamente preenchido
  5. Evidências claras (prints ou saída de testes) comprovando cada critério de aceite
- **Aprovação:** É necessária a aprovação de pelo menos 1 revisor do 4º período para merge.

---

## 5. Cuidados Essenciais e Boas Práticas

- **Dados 100% fictícios:** Nunca adicione dados reais (CPF, CNPJ, nomes de empresas, salários, etc.) no código, testes, banco de dados ou documentação (conformidade com LGPD / RNF-002).
- **Sem segredos no Git:** Chaves de API, senhas, tokens e credenciais devem ficar exclusivamente em arquivos `.env` locais, que estão no `.gitignore`. Utilize o `.env.example` para documentar variáveis necessárias.
- **Domínio das entregas:** O autor da entrega deve compreender plenamente qualquer código gerado ou auxiliado por IA, estando preparado para explicar cada trecho durante a revisão.
- **Evidências sólidas:** Afirmações verbais não substituem evidências. Cada critério de aceite (CA) requer validação prática.

