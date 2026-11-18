# 09 — Plano de Testes (Banco Neon, Cálculos, API e Segurança)

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Regra de Ouro (Seção 12):** Nenhum teste é marcado como `APROVADO` antes de sua execução real contra o banco e a aplicação. Nesta etapa de auditoria, todos os testes obrigatórios de banco (`DB-01` a `DB-15`) estão planejados e especificados com status `PENDENTE DE EXECUÇÃO`.

---

## 1. Suíte Obrigatória de Testes de Banco Neon PostgreSQL (`DB-01` a `DB-15`)

| ID | Teste Obrigatório | Procedimento de Verificação | Critério de Aceite | Status Atual |
|---|---|---|---|---|
| **DB-01** | **Conexão real ao Neon** | Executar query `SELECT current_database(), current_schema(), version()` via `pool` usando a `DATABASE_URL` do Neon com SSL ativo. | Conexão estabelecida sem erro; `current_schema()` retorna `pagamentus`. | ⏳ Pendente (Fase B/G) |
| **DB-02** | **Criação de registros via aplicação** | Cadastrar empresa (`PUT /api/company`), novo empregado (`POST /api/employees`), benefício (`POST /api/employees/:id/benefits`), evento (`POST /api/events`) e afastamento (`POST /api/employees/:id/leaves`). | Todos retornam HTTP 200/201 com IDs gerados pelo banco Neon. | ⏳ Pendente (Fase G) |
| **DB-03** | **Leitura de registros persistidos** | Consultar `GET /api/employees`, `GET /api/employees/:id`, `GET /api/events`, `GET /api/company` e conferir com `SELECT` direto no Neon. | Dados retornados pela API correspondem exatamente às linhas gravadas no Neon. | ⏳ Pendente (Fase G) |
| **DB-04** | **Atualização de registros** | Executar `PUT /api/employees/:id` (reajuste salarial), `PUT /api/events/:id` e `PUT /api/parameters/:chave`. | Valores atualizados com `updated_at` renovado e histórico gerado em `contract_changes`. | ⏳ Pendente (Fase G) |
| **DB-05** | **Relacionamentos (1:N)** | Consultar empregado com alterações contratuais, licenças, benefícios, eventos e itens de folha associados. | Junções (`JOIN`) retornam os vínculos corretos entre `employees`, `variable_events`, `payroll_runs` e `payroll_items`. | ⏳ Pendente (Fase G) |
| **DB-06** | **Persistência após reinicialização** | Encerrar o processo Node.js (`pool.end()`), iniciar nova instância do servidor e consultar os empregados e folhas gravados. | 100% dos registros permanecem intactos após reinicialização do servidor; `initDatabase()` não apaga dados existentes. | ⏳ Pendente (Fase G) |
| **DB-07** | **Persistência após nova sessão** | Limpar estado do cliente/navegador, abrir nova sessão e consultar folha e histórico no Neon. | Todos os dados permanecem disponíveis (nenhuma dependência de memória local para dados operacionais). | ⏳ Pendente (Fase G) |
| **DB-08** | **Persistência após redeploy autorizado de teste** | Realizar novo build/start da aplicação serverless/container e verificar a permanência dos dados no Neon. | Dados operacionais inalterados após novo ciclo de deploy. | ⏳ Pendente (Fase G) |
| **DB-09** | **Integridade referencial e de domínio** | Tentar inserir evento, ponto, benefício ou afastamento para `employee_id` inexistente ou com valores negativos/datas invertidas. | SGBD/API rejeita com HTTP 400/404/409 (erros PostgreSQL `23503`, `23505`, `23514`). | ⏳ Pendente (Fase G) |
| **DB-10** | **Transações e falhas controladas (Rollback)** | Enviar lote de ponto com o 2º registro inválido (`POST /api/time-records/import`) ou simular erro no meio da transação de cálculo da folha. | `ROLLBACK` completo: nenhum registro parcial fica salvo no banco. | ⏳ Pendente (Fase G) |
| **DB-11** | **Isolamento entre empresas/tenants** | Criar empregado no `organization_id = A` e tentar acessá-lo ou vinculá-lo a eventos usando `X-Organization-Id: B`. | Isolamento total garantido pela API e pelas FKs compostas `(organization_id, employee_id)` no banco (`23503`). | ⏳ Pendente (Fase G) |
| **DB-12** | **Persistência e imutabilidade de fechamento** | Calcular folha (`persist: true`), fechar a competência (`status: 'fechada'`) e tentar recalcular ou adicionar/excluir evento naquela competência. | Fechamento gravado no Neon; tentativas de alteração retornam HTTP 409 até que ocorra reabertura controlada. | ⏳ Pendente (Fase G) |
| **DB-13** | **Consulta histórica** | Consultar `GET /api/payroll/runs`, `GET /api/payroll/preview/:competencia`, `GET /api/payroll/receipt/:competencia/:employeeId` e `GET /api/payroll/audit-logs`. | Histórico de competências fechadas, holerites passados e logs de auditoria retornados com fidelidade. | ⏳ Pendente (Fase G) |
| **DB-14** | **Proteção de credenciais** | Inspecionar código-fonte, respostas da API, bundles estáticos (`src/public/*`) e `.gitignore`. | Nenhuma string `DATABASE_URL` ou segredo exposto no frontend, logs de erro ou repositório Git. | ⏳ Pendente (Fase G) |
| **DB-15** | **Recuperação e tratamento de erros temporários** | Simular falha/timeout ou query inválida e verificar se o cliente do `pg.Pool` é liberado (`client.release()` no `finally`) e o servidor continua respondendo. | Pool não vaza conexões e a aplicação recupera-se automaticamente na requisição seguinte. | ⏳ Pendente (Fase G) |

---

## 2. Casos de Referência para Validação dos Cálculos de Folha (`AC-05`)

Para comprovar a exatidão matemática do motor (`src/services/payrollService.ts`), os testes validarão os seguintes cenários de referência (com os parâmetros vigentes em `system_parameters`):

### Caso CR-01 — Ana Silva Ferreira (Salário R$ 2.850,00 | 44h | 1 Dependente | Adicional R$ 200,00)
- **Proventos:** Salário Base R$ 2.850,00 + Bonificação R$ 200,00 = **R$ 3.050,00**
- **Base Tributável (INSS/FGTS):** R$ 3.050,00
- **INSS Progressivo:**
  - 1ª Faixa: $1.412,00 \times 7,5\% = 105,90$
  - 2ª Faixa: $(2.666,68 - 1.412,00) \times 9,0\% = 1.254,68 \times 0,09 = 112,9212$
  - 3ª Faixa: $(3.050,00 - 2.666,68) \times 12,0\% = 383,32 \times 0,12 = 45,9984$
  - **Total INSS:** $\text{R\$ } 264,82$
- **IRRF:**
  - Dedução 1 dependente: R$ 189,59
  - Base IRRF: $3.050,00 - 264,82 - 189,59 = \text{R\$ } 2.595,59$ (Faixa 7,5%, dedução R$ 169,44)
  - Imposto: $(2.595,59 \times 0,075) - 169,44 = 194,669 - 169,44 = \text{R\$ } 25,23$
- **Total Descontos:** $264,82 + 25,23 = \text{R\$ } 290,05$
- **Salário Líquido:** $3.050,00 - 290,05 = \mathbf{R\$\; 2.759,95}$
- **FGTS (8%):** $3.050,00 \times 0,08 = \text{R\$ } 244,00$

### Caso CR-02 — Carlos Eduardo Santos (Salário R$ 5.200,00 | 40h | 2 Dependentes | 8h Extras a 50%)
- **Cálculo Hora Extra:** Salário-hora $= 5.200 / 200 = \text{R\$ } 26,00$; HE 50% $= 26,00 \times 1,5 \times 8 = \text{R\$ } 312,00$
- **Total Proventos / Base Tributável:** $5.200,00 + 312,00 = \text{R\$ } 5.512,00$
- **INSS Progressivo:**
  - 1ª: $105,90$ | 2ª: $112,9212$ | 3ª: $(4.000,03 - 2.666,68) \times 0,12 = 160,002$ | 4ª: $(5.512,00 - 4.000,03) \times 0,14 = 211,6758$
  - **Total INSS:** $\text{R\$ } 590,50$
- **IRRF:**
  - Dedução 2 dependentes: $2 \times 189,59 = \text{R\$ } 379,18$
  - Base IRRF: $5.512,00 - 590,50 - 379,18 = \text{R\$ } 4.542,32$ (Faixa 22,5%, dedução R$ 662,77)
  - Imposto: $(4.542,32 \times 0,225) - 662,77 = 1.022,022 - 662,77 = \text{R\$ } 359,25$
- **Total Descontos:** $590,50 + 359,25 = \text{R\$ } 949,75$
- **Salário Líquido:** $5.512,00 - 949,75 = \mathbf{R\$\; 4.562,25}$
- **FGTS (8%):** $5.512,00 \times 0,08 = \text{R\$ } 440,96$

### Caso CR-03 — Mariana Beatriz Oliveira (Salário R$ 7.800,00 | 40h | 0 Dependentes | Acima do Teto INSS)
- **Total Proventos / Base Tributável:** $\text{R\$ } 7.800,00$ (acima do teto da 4ª faixa R$ 7.786,02)
- **INSS Progressivo:** Limitado ao teto parametrizado = **R$ 908,85** (`tetoAtingido: true`)
- **IRRF:**
  - Base IRRF: $7.800,00 - 908,85 = \text{R\$ } 6.891,15$ (Faixa 27,5%, dedução R$ 896,00)
  - Imposto: $(6.891,15 \times 0,275) - 896,00 = 1.895,066 - 896,00 = \text{R\$ } 999,07$
- **Total Descontos:** $908,85 + 999,07 = \text{R\$ } 1.907,92$
- **Salário Líquido:** $7.800,00 - 1.907,92 = \mathbf{R\$\; 5.892,08}$
- **FGTS (8%):** $7.800,00 \times 0,08 = \text{R\$ } 624,00$

---

## 3. Testes de Segurança e RBAC (`RF-056`, `RNF-001`, `RNF-002`)

1. **Mascaramento para Perfil `consulta_assistente`:**
   - Requisições com header `X-User-Role: consulta_assistente` para `/api/employees`, `/api/events`, `/api/payroll/preview/:comp`, `/api/payroll/receipt/:comp/:id` e `/api/esocial/preview/:comp` devem retornar todos os campos salariais e monetários como `"R$ *****,**"` e CPFs como `"111.***.***-44"`.
2. **Bloqueio de Operações Críticas (`HTTP 403`):**
   - Requisições com `X-User-Role: consulta_assistente` para `POST /api/payroll/approve`, `POST /api/payroll/reopen`, `PUT /api/parameters/:chave` e `PUT /api/company` devem ser negadas com status `403 Forbidden`.
3. **Prevenção de SQL Injection e XSS:**
   - Entradas maliciosas em campos de texto (`nome`, `descricao`, `motivo`) são tratadas por queries parametrizadas (`$1, $2`) no PostgreSQL e escapadas por `escapeHtml()` no frontend (`src/public/js/app.js` L938).
