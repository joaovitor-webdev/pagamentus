# ADR-001: Definição da Stack Tecnológica, Escalabilidade e Segregação de Ambientes

- **Status:** Aprovado
- **Data:** 13/11/2026
- **Autor:** João Vitor (@joaovitor-webdev) - 2º Período de GTI
- **Revisores:** 4º Período de GTI
- **Requisitos Relacionados:** RF-079 (Ambientes separados), RNF-007 (Escalabilidade)

---

## 1. Contexto

O **Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda** atende escritórios contábeis, contadores autônomos e empresas de diversos portes. A plataforma necessita:
1. Suportar um volume crescente de clientes, documentos fiscais, partidas contábeis e usuários simultâneos sem degradação inaceitável de performance (**RNF-007 — Escalabilidade**).
2. Garantir o estrito isolamento entre o ambiente de testes/desenvolvimento e o ambiente de produção (**RF-079**), prevenindo riscos de vazamento, corrupção ou perda de dados reais.

---

## 2. Decisão Arquitetural

### 2.1 Stack Tecnológica Selecionada

Para atender à modularidade, tipagem estrita e escalabilidade horizontal, adotamos a seguinte stack:

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Linguagem & Runtime** | **Node.js (TypeScript)** | Tipagem estática em tempo de compilação, prevenindo erros em cálculos e regras contábeis/fiscais. Ecossistema consolidado e assíncrono para operações de I/O em lote. |
| **Backend / API** | **Express / Fastify (REST API)** | Arquitetura desacoplada e modular baseada em rotas, middlewares de autenticação/autorização e validação de esquemas (Zod/Joi). Baixa sobrecarga e facilidade para escala horizontal. |
| **Banco de Dados Relacional** | **PostgreSQL (v15+)** | Banco de dados relacional robusto com conformidade estrita ACID, suporte nativo a transações complexas para partidas dobradas, indexação eficiente (B-Tree, GIN para JSONB) e particionamento de tabelas. |
| **Gerenciador de Migrações / Acesso** | **Prisma ORM ou Knex.js** | Migrações de banco declarativas, versionadas no Git, garantindo reprodutibilidade idêntica de esquemas entre ambientes. |
| **Containerização** | **Docker & Docker Compose** | Padronização dos serviços auxiliares (PostgreSQL, Redis para cache/filas), garantindo paridade entre desenvolvimento, testes automatizados e produção. |

---

### 2.2 Estratégia de Escalabilidade (RNF-007)

Para assegurar o crescimento sustentável de clientes, documentos e lançamentos:

1. **Escala Horizontal da Aplicação:**
   - O backend opera de forma *stateless* (sem estado em sessão de memória local).
   - Autenticação via tokens JWT com assinatura criptográfica, permitindo múltiplas instâncias da API atrás de um balanceador de carga (*reverse proxy* / *load balancer*).

2. **Otimização e Isolamento no Banco de Dados:**
   - Isolamento multi-inquilino (*multi-tenant*) com chave de partição por organização (`organization_id`) indexada em todas as tabelas transacionais.
   - Suporte futuro a réplicas de leitura (*read replicas*) para desonerar a base primária durante geração de relatórios pesados e apurações anuais de IR.

3. **Processamento Assíncrono para Cargas Pesadas:**
   - Importações massivas de documentos fiscais (XML/SPED) e cálculos de fechamento de folha são projetados para execução em fila de tarefas em background, impedindo o bloqueio do ciclo de requisições HTTP da API.

---

### 2.3 Segregação de Ambientes (RF-079)

Para cumprir estritamente o **RF-079**, são instituídos dois ambientes formalmente isolados:

```text
+-----------------------------------+      +-----------------------------------+
|      Ambiente de Testes (TEST)     |      |    Ambiente de Produção (PROD)    |
|                                   |      |                                   |
| - NODE_ENV=test / development     |      | - NODE_ENV=production            |
| - Banco: pagamentus_test          |      | - Banco: pagamentus_prod          |
| - Dados 100% fictícios            |      | - Dados reais criptografados      |
| - Mocks de integrações externos   |      | - Conexões oficiais homologadas   |
| - Limpeza controlada entre testes |      | - Trilha de auditoria e backup    |
+-----------------------------------+      +-----------------------------------+
```

#### Regras de Segregação:

1. **Isolamento de Base de Dados:**
   - O ambiente de testes utiliza uma base separada (`pagamentus_test`), seja em container local ou instância de teste isolada.
   - É terminantemente proibido apontar rotinas de teste unitário, integração ou carga para a base de produção (`pagamentus_prod`).
   - A rotina de teardown de testes possui verificação mandatória: se `NODE_ENV === 'production'`, qualquer operação de limpeza ou truncamento de tabelas é imediatamente abortada com exceção fatal.

2. **Isolamento via Variáveis de Ambiente:**
   - O controle de comportamento é orientado pela variável `NODE_ENV` (`development`, `test`, `production`).
   - Nenhuma credencial ou URL de conexão de produção é versionada no repositório. O arquivo `.env.example` fornece exclusivamente parâmetros de simulação/teste com valores fictícios.

3. **Integrações Externas (Mocks e Sandboxes):**
   - No ambiente de testes, chamadas a órgãos públicos (Receita Federal, eSocial, Prefeituras) utilizam adaptadores *Mock* ou ambientes *Sandbox* oficiais, conforme sinalizado pelas flags `RECEITA_FEDERAL_API_MOCK=true` e `ESOCIAL_SANDBOX=true`.

---

## 3. Consequências

- **Positivas:**
  - Garantia de manutenibilidade com TypeScript e tipagem estrita.
  - Segurança jurídica e operacional ao impedir a contaminação ou perda de dados de produção durante testes.
  - Base arquitetural preparada para suportar grande volumetria sem necessidade de reescrita estrutural.
- **Limitações / Atenções:**
  - Exige rigor da equipe no versionamento correto de migrações (`migrations`) para manter os esquemas de teste e produção sincronizados.
  - Obrigatoriedade de manter o `.env` de cada desenvolvedor e ambiente configurado conforme as diretrizes do `.env.example`.

