# Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda

> **Projeto Integrador – Gestão da Tecnologia da Informação (GTI)**  
> **Desenvolvimento:** 2º Período de GTI  
> **Gestão e Revisão:** 4º Período de GTI  
> **Método:** Spec-Driven Development (SDD)  
> **Ferramentas de Apoio:** Trello & GitHub  

---

## 📌 Visão Geral

O **Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda** é uma solução centralizada voltada para escritórios contábeis, contadores autônomos, setores fiscais e empresas. 

O sistema organiza e unifica rotinas contábeis, apuração tributária parametrizável, gestão de folha de pagamento, controle de contas a pagar e receber, conformidade com obrigações acessórias e preparação de declarações de Imposto de Renda (Pessoa Física e Jurídica), garantindo isolamento multi-inquilino, rastreabilidade e estrita conformidade com a LGPD.

---

## 👥 Divisão das Frentes de Trabalho (2º Período)

| Item | Frente de Atuação | Responsável | Specs Associadas |
| :--- | :--- | :--- | :--- |
| **1** | Plataforma, arquitetura e segurança | **João Vitor** | `SPEC-1.x` |
| **2** | Contabilidade e financeiro | **Ítalo** | `SPEC-2.x` |
| **3** | Fiscal, tributos e Imposto de Renda | **Matheus** | `SPEC-3.x` |
| **4** | Folha, obrigações e atendimento ao cliente | **Douglas** | `SPEC-4.x` |
| **5A** | Experiência, painéis e relatórios | **Erivan** | `SPEC-5.1` a `5.3` |
| **5B** | Integrações e qualidade | **Pablo** | `SPEC-5.4` a `5.6` |

---

## 📂 Estrutura do Repositório

```text
/
├── README.md              # Visão geral, orientações e índice de navegação
├── CONTRIBUTING.md        # Diretrizes de SDD, branches, commits e fluxo de PR
├── CHANGELOG.md           # Histórico e auditoria de specs concluídas
├── .gitignore             # Arquivos e pastas ignorados pelo controle de versão
├── .env.example           # Exemplo de variáveis de ambiente (dados fictícios)
│
├── docs/
│   ├── escopo.md          # Documento oficial de requisitos (RF, RNF, RB do 4º período)
│   ├── organizacao.md     # Frentes, fluxo no Trello, governança e ciclo SDD
│   └── arquitetura/       # Decisões de Arquitetura (ADRs) e modelo de dados
│       └── README.md
│
├── specs/                 # Especificações executáveis (SDD) por frente
│   ├── _modelo/
│   │   └── SPEC-MODELO.md # Template oficial para novas especificações
│   ├── item-1-plataforma/
│   ├── item-2-contabilidade/
│   ├── item-3-fiscal-ir/
│   ├── item-4-folha-atendimento/
│   └── item-5-experiencia-integracoes/
│
├── .github/
│   └── pull_request_template.md # Modelo de PR com critérios de aceite e evidências
│
└── src/                   # Código-fonte da aplicação (definido na SPEC-1.2)
```

---

## 🔄 Metodologia: Spec-Driven Development (SDD)

Todas as entregas do projeto seguem o ciclo estruturado de SDD:

1. **Especificar:** O responsável copia [`specs/_modelo/SPEC-MODELO.md`](specs/_modelo/SPEC-MODELO.md), mapeia os requisitos do [`docs/escopo.md`](docs/escopo.md) e define os critérios de aceite (`CA-X`) antes de escrever qualquer código.
2. **Planejar & Quebrar:** Define endpoints, tabelas e checklist de tarefas.
3. **Branch Dedicada:** Cria a branch no padrão `spec/<item>.<spec>-<nome>` (ex.: `spec/2.1-plano-de-contas`).
4. **Implementar:** Implementa com suporte de IA fazendo estritamente o que está nos critérios de aceite.
5. **Validar com Evidências:** Registra prints, saídas de testes ou logs provando o cumprimento de cada critério.
6. **Revisão pelo 4º Período:** O revisor do 4º período avalia o PR e move o cartão no Trello entre `Revisando`, `Feito` ou `Com ressalvas`.

Para mais detalhes sobre as regras de branches, mensagens de commit e PRs, leia o [**CONTRIBUTING.md**](CONTRIBUTING.md).

---

## 🔒 Diretrizes de Segurança e Boas Práticas

- **LGPD & Dados Fictícios:** É estritamente proibido incluir dados reais (CPFs, CNPJs, salários, documentos) no repositório, prints ou Trello (RNF-002).
- **Sem Segredos Versionados:** Chaves de acesso, credenciais e conexões residem apenas no arquivo `.env` local, devidamente ignorado pelo Git.
- **Parametrização Legal:** Regras fiscais e trabalhistas nunca devem ser inventadas. Devem utilizar parâmetros claros de simulação com vigência documentada.

---

## 🚀 Como Executar o Projeto

A definição da stack tecnológica oficial, dependências e comandos de execução local faz parte da **SPEC-1.2** (Decisão de arquitetura, stack e ambientes) a ser revisada e aprovada pelo 4º período.
Após a aprovação, as instruções detalhadas de instalação e execução estarão disponíveis nesta seção.

