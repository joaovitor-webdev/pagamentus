# ADR-001: Stack tecnológica e segregação de ambientes

- **Status:** Proposto para revisão
- **Data:** 23/11/2026
- **Autor:** João Vitor (@joaovitor-webdev)
- **Requisitos relacionados:** RF-079, RNF-007

## 1. Contexto

O projeto precisa manter os testes separados do ambiente de produção e registrar uma stack comum para as frentes de desenvolvimento. O RNF-007 não especifica volume de dados, concorrência, latência ou critérios mensuráveis de degradação; portanto, esta decisão registra a arquitetura atual e não declara capacidade de carga já comprovada.

## 2. Decisões

### 2.1 Stack adotada

| Camada | Tecnologia atual | Justificativa |
|---|---|---|
| Runtime | Node.js 20 | Versão usada nas imagens de aplicação do repositório. |
| Linguagem | TypeScript 5 | Tipagem estática e compilação para JavaScript. |
| API | Express 4 | Framework usado nas rotas e no servidor. |
| Banco de dados | PostgreSQL 16 | Banco relacional usado pelo módulo persistido. |
| Acesso ao banco | Driver `pg` | Driver PostgreSQL usado pelo projeto; não há ORM adotado. |
| Interface existente | HTML, CSS e JavaScript | Interface sem framework padrão de frontend estabelecido. |
| Testes | Jest e Supertest | Ferramentas presentes para testes automatizados e HTTP. |
| Ambiente local | Docker Compose | Provisiona a aplicação e o PostgreSQL para execução local. |

Não fazem parte desta decisão a adoção de NestJS, Fastify, Prisma, Knex, Redis, filas ou framework adicional de frontend.

### 2.2 Escalabilidade (RNF-007)

- O acesso assíncrono de Node.js e o pool de conexões do PostgreSQL permitem atender operações de I/O sem bloquear uma thread por requisição.
- A aplicação pode ser executada em mais de uma instância quando configuração, persistência e estado compartilhado forem compatíveis com esse modo de operação.
- Consultas, índices, particionamento, réplicas e processamento em background devem ser avaliados conforme dados medidos; não são apresentados como recursos integralmente configurados ou validados neste ADR.
- A equipe precisa definir metas de carga e executar testes de desempenho antes de afirmar um limite suportado. Esses valores não estão definidos no RNF-007.

### 2.3 Segregação de ambientes (RF-079)

`NODE_ENV` identifica o modo de execução:

| `NODE_ENV` | Variável de conexão | Banco esperado |
|---|---|---|
| `development` | `DATABASE_URL` | `pagamentus_dev` |
| `test` | `DATABASE_URL_TEST` | `pagamentus_test` |
| `production` | `DATABASE_URL` | `pagamentus_prod` |

O resolvedor de configuração valida a URL e o nome do banco antes de criar o pool. No modo `test`, `DATABASE_URL` não é alternativa para `DATABASE_URL_TEST`: se a variável de teste estiver ausente ou indicar outro banco, a inicialização falha explicitamente.

O Compose local pode manter bancos lógicos separados no mesmo servidor PostgreSQL para desenvolvimento e testes. Essa conveniência local não substitui a configuração de infraestrutura isolada para produção. A URL de produção e suas credenciais devem ser fornecidas pelo ambiente de implantação ou por um gerenciador de segredos; não devem ser incluídas no repositório.

O arquivo `.env.example` contém apenas endereços e credenciais fictícios de exemplo. Cada ambiente deve receber sua própria configuração antes de iniciar a aplicação ou os testes.

## 3. Consequências

### Positivas

- A stack fica documentada sem manter alternativas incompatíveis como decisões em aberto.
- A seleção explícita do banco reduz o risco de uma execução de teste gravar no banco de desenvolvimento ou produção.
- A equipe pode ajustar a infraestrutura de escala com base em medições, sem tratar hipóteses como garantias.

### Limitações

- A validação pelo nome do banco não substitui isolamento de rede, credenciais e instâncias na implantação.
- O requisito não define metas quantitativas de escalabilidade; a capacidade precisa ser avaliada em trabalho próprio de desempenho.
- O Compose local é destinado a desenvolvimento e teste, não constitui configuração de produção.
