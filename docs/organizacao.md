# Organização do projeto: Sistema Integrado de Contabilidade, Fiscal e IR

Time de desenvolvimento: 2º período de GTI · Gestão e revisão: 4º período · Método: Spec-Driven Development (SDD) · Gestão: Trello

> Proposta de organização. Ajuste o que o 4º período ou o professor pedirem diferente.

## 1. Divisão dos itens entre os 6 membros

| Item | Frente | Responsável | Specs |
| --- | --- | --- | --- |
| 1 | Plataforma, arquitetura e segurança | João Vitor | SPEC-1.x |
| 2 | Contabilidade e financeiro | Ítalo | SPEC-2.x |
| 3 | Fiscal, tributos e Imposto de Renda | Matheus | SPEC-3.x |
| 4 | Folha, obrigações e atendimento ao cliente | Douglas | SPEC-4.x |
| 5A | Experiência, painéis e relatórios | Erivan | SPEC-5.1 a 5.3 |
| 5B | Integrações e qualidade | Pablo | SPEC-5.4 a 5.6 |

Proposta: dividir o **item 5**, porque é o único sem responsável e tem duas metades naturais. O **5A** é tudo que o usuário vê (navegação, interface responsiva, painéis, exportações). O **5B** garante que as partes funcionem juntas (APIs, importações, testes, homologação).

A numeração continua única dentro do item 5 (SPEC-5.1 a 5.6), então nenhum ID se repete. No Trello ficam duas listas, "Item 5A" e "Item 5B".

A alternativa seria dividir o item 1, que é o maior, mas ele concentra a fundação (arquitetura, dados, segurança) e funciona melhor com uma pessoa só decidindo.

## 2. Ciclo de uma spec (SDD)

1. **Especificar:** o responsável copia o modelo de spec e preenche contexto, requisitos relacionados (RF, RNF, RB), escopo e critérios de aceite. Isso vem **antes** do código.
2. **Planejar:** descreve de forma resumida a solução técnica (telas, tabelas, endpoints).
3. **Quebrar em tarefas:** lista os passos de implementação.
4. **Implementar** na branch da spec, com ajuda da IA, fazendo só o que está nos critérios de aceite.
5. **Validar:** testa cada critério e registra as evidências (prints, saída de testes, link do PR).
6. **Revisar:** o 4º período confere os critérios e decide entre Feito e Com ressalvas.

## 3. Governança no Trello

### Listas

- Uma lista por item, com as specs ainda não iniciadas: `Item 1 – Plataforma (João)`, `Item 2 – Contabilidade (Ítalo)`, `Item 3 – Fiscal e IR (Matheus)`, `Item 4 – Folha e atendimento (Douglas)`, `Item 5A – Experiência (Erivan)`, `Item 5B – Integrações e qualidade (Pablo)`.
- Fluxo comum: `Fazendo` → `Revisando` → `Feito`, mais a lista `Com ressalvas`.

Como o cartão sai da lista do item quando é movido, a identificação precisa ficar no próprio cartão: título com o ID da spec, etiqueta de cor do item e o responsável como membro.

### Cartão padrão

- **Título:** `SPEC-2.1 – Plano de contas`
- **Etiqueta:** o item (uma cor por item)
- **Membros:** o dev responsável e, na revisão, o revisor do 4º período
- **Descrição:** link do arquivo da spec no GitHub, requisitos relacionados (ex.: RF-006, RB-001) e link do PR
- **Checklist:** os critérios de aceite copiados da spec (CA-1, CA-2...)
- **Evidências:** anexos e comentário com prints, saída de testes, link do PR e do commit

### Regras do fluxo

1. Cada pessoa mantém uma spec em `Fazendo` por vez.
2. Ao terminar: abre o PR, anexa as evidências, marca o checklist e move o cartão para `Revisando`.
3. O revisor do 4º período confere cada critério. Se estiver tudo certo, move para `Feito`. Se não, move para `Com ressalvas` e comenta no formato abaixo.
4. O dev corrige na mesma branch, responde o comentário e move de volta para `Revisando`.
5. O ciclo se repete até a spec chegar em `Feito`.

### Formato do comentário de ressalva

```
RESSALVA #1 – SPEC-2.1
Critério: CA-3
Problema: lançamento desbalanceado foi aceito.
Para aprovar: mostrar o erro ao salvar e anexar print ou teste.
```

## 4. Repositório principal

### Estrutura

```
/
├── README.md              visão geral, como rodar, links
├── CONTRIBUTING.md        fluxo de contribuição
├── CHANGELOG.md           auditoria de mudanças
├── docs/
│   ├── escopo.md          requisitos do 4º período (RF, RNF, RB)
│   ├── organizacao.md     itens, responsáveis, Trello, glossário
│   └── arquitetura/       decisões (ADRs) e modelo de dados
├── specs/
│   ├── _modelo/SPEC-MODELO.md
│   ├── item-1-plataforma/
│   ├── item-2-contabilidade/
│   ├── item-3-fiscal-ir/
│   ├── item-4-folha-atendimento/
│   └── item-5-experiencia-integracoes/
├── .github/pull_request_template.md
└── src/                   código (estrutura definida na SPEC-1.2)
```

### Branches, commits e pull requests (para o CONTRIBUTING.md)

- **Branch:** `spec/<item>.<spec>-<nome>`, ex.: `spec/2.1-plano-de-contas`.
- **Commits:** `tipo(SPEC-X.Y): descrição`, ex.: `feat(SPEC-2.1): cria cadastro de contas`. Tipos: `feat`, `fix`, `docs`, `test`, `refactor`.
- **Um PR por spec**, com título `[SPEC-2.1] Plano de contas`. Nada vai direto na `main` (ativar a proteção da branch: PR obrigatório e 1 aprovação).
- **Todo PR inclui:** o arquivo da spec em `specs/`, o código, os testes quando houver e a linha no `CHANGELOG.md`.
- **Merge** só depois da aprovação do revisor; em seguida o cartão vai para `Feito`. Se houver ressalva, o PR continua aberto e recebe novos commits.

### CHANGELOG.md

```
# Changelog
Uma linha por spec concluída, no estilo Keep a Changelog.

## [Não lançado]
### Adicionado
- [SPEC-1.1] Estrutura do repositório e documentação base (PR #1, João Vitor)
### Alterado
### Corrigido
```

### Modelo de PR (`.github/pull_request_template.md`)

```
## Spec
SPEC-X.Y – título · Item X
Cartão no Trello: <link>

## O que foi feito
(resumo em 2 ou 3 linhas)

## Critérios de aceite
- [ ] CA-1 ...
- [ ] CA-2 ...

## Evidências
(prints, saída de testes, links)

## Checklist
- [ ] Arquivo da spec em specs/ criado ou atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Testado localmente
- [ ] Sem dados reais, senhas ou chaves no código
- [ ] Cartão do Trello movido para Revisando
```

## 5. Modelo de spec (`specs/_modelo/SPEC-MODELO.md`)

```
# SPEC-X.Y – Título

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| X – nome | @usuario | @usuario | link | Fazendo |

## 1. Contexto e objetivo
Por que esta spec existe e o que entrega.

## 2. Requisitos relacionados
RF-000, RNF-000, RB-000 (do docs/escopo.md).

## 3. Escopo
Dentro do escopo:
Fora do escopo:

## 4. Comportamento esperado
Cenários em linguagem simples (fluxo normal e de erro).

## 5. Critérios de aceite
- CA-1: Dado ..., quando ..., então ...
- CA-2: ...

## 6. Plano técnico
Telas, tabelas, endpoints e decisões. Seja breve.

## 7. Tarefas de implementação
- [ ] Tarefa 1
- [ ] Tarefa 2

## 8. Dependências
Outras specs que precisam estar prontas (ex.: SPEC-1.3).

## 9. Como validar
Passo a passo para testar cada critério.

## 10. Evidências (preencher ao concluir)
Link do PR, prints, saída de testes, por critério.

## 11. Histórico de revisão
Ressalvas recebidas e como foram resolvidas.
```

## 6. Primeiro lote de specs sugerido

São specs pequenas, para o time começar. O 4º período pode repriorizar. O MVP do planejamento pede cadastros, documentos, plano de contas, lançamentos, relatórios básicos e auditoria.

| Spec | Título | Requisitos | Critério de aceite principal |
| --- | --- | --- | --- |
| **Item 1 – João Vitor** |  |  |  |
| SPEC-1.1 | Estrutura do repositório e documentação base | RNF-011 | README, CONTRIBUTING, CHANGELOG, `specs/` e modelos na `main` |
| SPEC-1.2 | Decisão de arquitetura, stack e ambientes | RNF-011, RF-079 | ADR com a stack, a justificativa e como rodar localmente |
| SPEC-1.3 | Modelo de dados inicial | Seção 7 do escopo, RB-008 | Esquema com organização, empresa, usuário, perfil e permissão; todo registro pertence a uma organização |
| SPEC-1.4 | Usuários, perfis e permissões | RF-075, RNF-003 | Login funcional com 3 perfis do escopo; ação restrita é negada a quem não tem permissão |
| SPEC-1.5 | Trilha de auditoria básica | RF-015, RNF-004 | Criar, alterar e excluir (lógico) gera log com usuário, data, objeto e operação |
| **Item 2 – Ítalo** |  |  |  |
| SPEC-2.1 | Plano de contas | RF-006 | Contas sintéticas e analíticas com código, natureza e hierarquia; só a analítica recebe lançamento |
| SPEC-2.2 | Lançamento contábil com partidas dobradas | RF-007, RF-008, RB-001 | Lançamento com débito diferente do crédito é rejeitado com mensagem clara |
| SPEC-2.3 | Recorrentes, rateios, provisões e estornos | RF-009 | Modelo recorrente gera lançamentos; rateios, provisões e estornos mantêm vínculo com o lançamento original |
| **Item 3 – Matheus** |  |  |  |
| SPEC-3.1 | Importação de documentos fiscais | RF-016 | Preserva o arquivo original e verifica sua integridade por SHA-256 |
| SPEC-3.2 | Notas de entrada e saída | RF-017 | Registra notas, retenções, cancelamentos, devoluções e ajustes aplicáveis |
| SPEC-3.3 | Validação fiscal e duplicidades | RF-018 | Valida documentos conforme regras da empresa e rejeita duplicidades com os motivos |
| SPEC-3.4 | Classificação das operações | RF-019 | Classifica a operação por natureza, CFOP, NCM e CST/CSOSN conforme regime, com tabelas fictícias |
| SPEC-3.5 | Regras tributárias versionadas | RF-080, RB-004 | Aplica a versão vigente conforme exercício, regime, jurisdição e situação do contribuinte |
| SPEC-3.6 | Regimes tributários | RF-025, RF-026 | Mantém opções de regime, parâmetros e histórico com vigência temporal |
| SPEC-3.7 | Cálculo e memória de cálculo | RF-020, RF-021, RF-027, RNF-012 | Calcula tributos aplicáveis e retorna memória detalhada e reproduzível |
| SPEC-3.8 | Retenções, créditos e parcelamentos | RF-022 | Controla retenções, créditos, compensações, parcelas e vencimentos |
| SPEC-3.9 | Guias e demonstrativos | RF-023 | Prepara guia para conferência e a identifica como não transmitida |
| **Item 4 – Douglas** |  |  |  |
| SPEC-4.1 | Cadastro de empregados, contratos e folha de pagamento | RF-051 a RF-056 | Cadastro, cálculo, eventos, arquivo de conferência, recibos e controle de acesso conforme critérios da spec |
| SPEC-4.2 | Eventos variáveis e afastamentos | RF-053 | Registros de eventos, ponto, afastamentos, benefícios e histórico contratual validados e associados ao tenant |
| SPEC-4.3 | Portal de documentos do cliente | RF-066, RF-067, RF-068 | Cliente envia documento e vê só os próprios; checklist marca como recebido |
| **Item 5A – Erivan** |  |  |  |
| SPEC-5.1 | Navegação e layout responsivo | RNF-009 | Menu muda conforme o perfil e as telas funcionam em celular, tablet e computador |
| SPEC-5.2 | Painel inicial | RF-072 | Painel mostra indicadores (tarefas por status, pendências) com dados de exemplo |
| SPEC-5.3 | Exportação de relatórios | RF-071, RF-073 | Exporta uma listagem filtrada em CSV e PDF e registra usuário, data e filtros |
| **Item 5B – Pablo** |  |  |  |
| SPEC-5.4 | Plano de testes e rastreabilidade | RNF-011, RNF-012 | Matriz RF → spec → teste cobrindo as specs do primeiro lote |
| SPEC-5.5 | Padrão e documentação da API | RF-077 | Contrato (OpenAPI) com autenticação, formato de erro e exemplos; uma rota de teste documentada |
| SPEC-5.6 | Importação de arquivos com pré-validação | RF-078, RB-006 | Importar CSV mostra resumo de aceitos, rejeitados e duplicados antes de gravar |

### Specs do Item 2 posteriores ao lote inicial

| Spec | Título | Requisitos | Critério de aceite principal |
| --- | --- | --- | --- |
| SPEC-2.4 | Importação de lançamentos | RF-010 | Lote é pré-validado, apresenta erros e pode ser desfeito |
| SPEC-2.5 | Períodos contábeis | RF-012, RB-002 | Período encerrado só é reaberto com permissão, justificativa e auditoria |
| SPEC-2.6 | Centros de custo e comparativos | RF-014 | Dimensões gerenciais são associadas aos lançamentos e comparadas entre períodos |
| SPEC-2.7 | Balancete, razão e diário | RF-013 (parte 1) | Relatórios contábeis previstos são gerados para o período |
| SPEC-2.8 | Balanço, DRE, DFC e DMPL | RF-013 (parte 2) | Demonstrações contábeis previstas são geradas para o período |
| SPEC-2.9 | Títulos a pagar e a receber e vínculos | RF-046, RF-050 | Títulos, parcelas e vínculos documentais são mantidos |
| SPEC-2.10 | Baixas, juros e inadimplência | RF-047 | Baixas totais/parciais, encargos e estornos atualizam o saldo |
| SPEC-2.11 | Conciliação contábil e bancária | RF-011, RF-048 | Extratos e saldos são conciliados com confirmação das correspondências |
| SPEC-2.12 | Fluxo de caixa e relatórios financeiros | RF-049 | Fluxo e relatórios financeiros são gerados conforme filtros informados |
| SPEC-2.13 | Patrimônio e estoque | RF-057 a RF-060 | Bens, movimentações e saldos de estoque são controlados conforme a spec |

### Situação dos PRs abertos do Item 4

| Spec | PR | Situação verificada |
| --- | --- | --- |
| SPEC-4.3 – Portal de documentos do cliente | [#16](https://github.com/joaovitor-webdev/pagamentus/pull/16) | Título corrigido; branch do fork ainda usa `spec/4.3-calculo-folha` e depende do autor |
| SPEC-4.4 – Recibos, relatórios e eventos oficiais | [#34](https://github.com/joaovitor-webdev/pagamentus/pull/34) | CA-1 está pendente até definição do leiaute oficial vigente |
| SPEC-4.5 – Aprovação da folha e dados sensíveis | [#35](https://github.com/joaovitor-webdev/pagamentus/pull/35) | Perfis simulados não autenticam a identidade; não considerar controle de produção |
| SPEC-4.6 – Calendário e versões de leiautes | [#36](https://github.com/joaovitor-webdev/pagamentus/pull/36) | PR contém somente a especificação; implementação e testes da aplicação não foram executados |

**Ordem e dependências.** As SPEC-1.1 e 1.2 saem primeiro, porque definem o repositório e a stack. Enquanto isso, todos já escrevem as próprias specs (etapas 1 a 3 do ciclo), que não dependem da stack. A implementação começa quando a SPEC-1.2 for aprovada. Os nomes de entidades das specs 2 a 4 devem seguir a SPEC-1.3.

## 7. Prompts de IA para o fluxo SDD

**A. Criar a spec**

```
Atue como analista de requisitos em um projeto com Spec-Driven Development. Vou colar o modelo de spec do projeto e os requisitos relacionados. Preencha a SPEC-X.Y – [título] sem inventar requisitos além dos listados: contexto, escopo e fora do escopo, cenários, critérios de aceite verificáveis (CA-1, CA-2... no formato Dado/Quando/Então), plano técnico resumido e tarefas. Seja objetivo e escreva em português.
Modelo: [cole o modelo]
Requisitos: [cole os RF, RNF e RB]
```

**B. Implementar**

```
Implemente a spec abaixo usando a stack definida em docs/arquitetura. Faça apenas o que está no escopo e nos critérios de aceite, nada além. Entregue arquivo por arquivo, com comentários em português, e explique como rodar. No final, liste qual parte do código atende cada critério de aceite.
[cole a spec]
```

**C. Testes e evidências**

```
Com base nos critérios de aceite da spec e no código abaixo, gere: (1) casos de teste, com pelo menos um por critério e incluindo cenários de erro; (2) um passo a passo para eu validar manualmente e quais prints devo tirar; (3) um comentário curto para o cartão do Trello resumindo as evidências critério por critério.
[cole a spec e o código]
```

**D. Corrigir uma ressalva**

```
O revisor deixou esta ressalva na spec: [cole o comentário]. Indique a causa provável no código abaixo, a correção mínima e como provar que foi resolvido (teste ou print). Não altere nada fora disso.
[cole o código]
```

## 8. Cuidados do projeto

- **Dados sempre fictícios.** Nada de CPF, CNPJ, salários ou documentos reais no repositório, nos prints ou no Trello (LGPD, RNF-002).
- **Regras fiscais e trabalhistas não se inventam.** O próprio escopo (RF-041, RB-004, RB-010) pede isso. Use parâmetros claramente fictícios nos exemplos e registre na spec que as regras reais precisam de validação profissional.
- **Segredos fora do GitHub.** Senhas, tokens e chaves ficam em um arquivo `.env` listado no `.gitignore`.
- **A IA gera, quem entrega entende.** Antes de abrir o PR, a pessoa deve conseguir explicar o código ao revisor.
- **Evidência vale mais que afirmação.** Cada critério de aceite precisa de print, teste ou link.

## 9. Pontos para combinar com o 4º período

- Quem é o revisor de cada item (um nome por item) e quem aprova e faz o merge dos PRs.
- Se a stack é livre ou já existe uma preferência.
- Prazos: datas de entrega do primeiro lote e frequência das revisões.
- Se aceitam este modelo de spec e o primeiro lote como ponto de partida.
