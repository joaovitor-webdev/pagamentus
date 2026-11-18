# 06 — Escopo Funcional e Regras Legais de Folha de Pagamento (CLT)

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Referências do Projeto:** `docs/escopo.md` (RF-051 a RF-056, RB-002, RB-003, RB-007, RB-010, RNF-002, RNF-012) e `specs/item-4-folha-atendimento/SPEC-4.1.md` & `SPEC-4.2.md`.

---

## 1. Escopo da Primeira Versão Operacional (MVP Ponta a Ponta) vs. Versões Posteriores

### 1.1. Dentro do Primeiro Escopo Operacional (Obrigatório)
1. **Cadastro da Empresa Empregadora:** Razão Social, Nome Fantasia, CNPJ (fictício para conformidade LGPD), Regime Tributário, Endereço e Responsável de RH.
2. **Cadastro de Funcionários e Vínculos CLT (`RF-051`):** Nome completo, CPF fictício, cargo, departamento, regime contratual, salário-base mensal, jornada semanal (`44h`, `40h`, `30h`, `20h`), data de admissão, número de dependentes para IRRF e status (`ativo`, `afastado`, `inativo`).
3. **Histórico de Alterações Contratuais (`RF-053`):** Registro rastreável de admissão inicial, reajustes salariais, promoções de cargo, alterações de jornada, departamento e regime contratual.
4. **Gestão de Benefícios (`RF-053` / `SPEC-4.2`):** Vínculo de Vale-Transporte, Vale-Refeição, Vale-Alimentação e Plano de Saúde por funcionário, com valor do benefício e valor de desconto do empregado em folha.
5. **Afastamentos e Licenças (`RF-053` / `SPEC-4.2`):** Registro de afastamentos (Médico/Doença, Licença Maternidade, Licença Paternidade, Férias, Acidente de Trabalho, Sem Remuneração) com validação de datas e bloqueio transacional de sobreposição de períodos.
6. **Eventos Variáveis Mensais e Ponto (`RF-053`):**
   - Horas extras (com cálculo automático sobre o salário-hora e adicional de 50%, 100% ou percentual informado, ou valor fixo);
   - Faltas e atrasos (com cálculo automático por dias sobre salário/30 ou valor informado);
   - Adicionais / bonificações / gratificações;
   - Outros descontos variáveis;
   - Importação/registro de espelho de ponto (`time_records`).
7. **Motor de Cálculo Mensal, Férias e 13º Salário (`RF-052`):**
   - Cálculo de proventos (Salário-base + Horas Extras + Adicionais);
   - Dedução de faltas na base tributável;
   - Cálculo progressivo do **INSS Empregado** por faixas salariais respeitando o teto parametrizado;
   - Cálculo progressivo do **IRRF Retido na Fonte** (Base tributável − INSS − Dedução por dependente) aplicando alíquota e parcela a deduzir;
   - Desconto de benefícios ativos do empregado e outros descontos;
   - Cálculo de **FGTS Mensal (8%)** e **Encargos Patronais** (INSS Patronal 20% + RAT 2% + Terceiros 5,8%);
   - Cálculo de **Provisões Mensais** de 13º Salário (1/12 + encargos) e Férias (1/12 + 1/3 constitucional + encargos);
   - Simulador dedicado de **Férias Individuais** (com 1/3 constitucional, INSS, IRRF e FGTS) e **13º Salário** (1ª parcela de adiantamento 50% sem descontos e 2ª parcela de quitação com INSS e IRRF).
8. **Conferência, Aprovação, Fechamento e Reabertura Controlada (`RF-056`, `RB-002`, `RB-003`):**
   - Checklist de conferência por colaborador;
   - Fluxo de estados da competência: `rascunho` → `aprovada` → `fechada`;
   - Bloqueio estrito de alterações após `fechada`, com possibilidade de **reabertura controlada** mediante justificativa e auditoria.
9. **Emissão de Demonstrativos e Arquivos de Conferência (`RF-054`, `RF-055`):**
   - Recibo de Pagamento de Salário (**Holerite**) em visualização mobile responsiva e layout formal de impressão/PDF;
   - Demonstrativo consolidado de encargos e provisões da empresa;
   - Geração de arquivo estruturado de conferência do **eSocial** (`S-1000`, `S-2200`, `S-2230`, `S-1200`) em formatos abertos `JSON` e `TXT`.
10. **Controle de Acesso (RBAC), Mascaramento LGPD e Trilha de Auditoria (`RF-056`, `RNF-002`, `RNF-004`):**
    - Segregação entre `rh_admin` (acesso total e aprovação) e `consulta_assistente` (visualização com valores salariais e CPFs mascarados);
    - Registro histórico de todas as operações relevantes em `payroll_approval_logs`.

### 1.2. Escopo de Versões Posteriores (Fora do MVP Inicial)
- Cálculo completo de Rescisão de Contrato de Trabalho (TRCT) com multas rescisórias FGTS (40%/20%) e aviso prévio indenizado;
- Folha complementar / múltiplos vínculos simultâneos (concomitância de matrículas no mesmo CPF) com teto unificado de INSS;
- Desoneração da folha (CPRB) e regimes especiais de tributação previdenciária (Simples Nacional Anexo IV / MEI / Produtor Rural);
- Integração de transmissão telemática com certificado digital ICP-Brasil (A1/A3) para webservices governamentais do eSocial / EFD-Reinf / DCTFWeb;
- Geração de arquivo bancário CNAB 240 ou iniciação de pagamento via API PIX.

---

## 2. Regras de Cálculo Implementadas e Parametrizadas (`payrollService.ts`)

> [!IMPORTANT]
> Em estrita observância à regra **RB-010** (`docs/escopo.md`) e à Seção 9 do Prompt Mestre, os parâmetros trabalhistas e previdenciários têm **vigência documentada (Tabela Referencial CLT 2024/2026 configurada no projeto)** e são armazenados na tabela `pagamentus.system_parameters`.

### 2.1. Salário-Hora, Horas Extras e Faltas
- **Divisor Mensal:**
  - Jornada de `44h semanais`: divisor de **220 horas/mês**;
  - Jornada de `40h semanais`: divisor de **200 horas/mês**;
  - Demais jornadas (`30h`, `20h`): proporcionalizadas ou conforme divisor contratual.
- **Valor da Hora Normal:** $\text{Valor Hora} = \frac{\text{Salário Base}}{\text{Divisor}}$.
- **Valor da Hora Extra:** $\text{HE} = \text{Valor Hora} \times \left(1 + \frac{\text{Percentual}}{100}\right) \times \text{Quantidade de Horas}$ (padrão 50% para dias úteis, 100% para domingos/feriados).
- **Desconto de Falta Injustificada:** $\text{Falta} = \left(\frac{\text{Salário Base}}{30}\right) \times \text{Dias de Falta}$.

### 2.2. Tabela Progressiva do INSS Empregado (RGPS)
Aplicada de forma progressiva por faixa salarial sobre a **Base Tributável** ($\text{Total de Proventos Tributáveis} - \text{Faltas}$):

| Faixa | Salário de Contribuição (R$) | Alíquota Progressiva |
|---|---|---|
| 1ª Faixa | Até R$ 1.412,00 | 7,5% |
| 2ª Faixa | De R$ 1.412,01 até R$ 2.666,68 | 9,0% |
| 3ª Faixa | De R$ 2.666,69 até R$ 4.000,03 | 12,0% |
| 4ª Faixa | De R$ 4.000,04 até R$ 7.786,02 (Teto) | 14,0% |

- **Teto Máximo de Desconto (`teto_inss`):** R$ 908,85 (parametrizável em `system_parameters`).

### 2.3. Imposto de Renda Retido na Fonte (IRRF)
- **Base de Cálculo do IRRF:**
  $$\text{Base IRRF} = \max\left(0,\; \text{Base Tributável} - \text{Desconto INSS} - (\text{Nº Dependentes} \times \text{R\$ 189,59})\right)$$
- **Tabela Progressiva Mensal:**

| Faixa de Base de Cálculo (R$) | Alíquota | Parcela a Deduzir do IRRF (R$) |
|---|---|---|
| Até R$ 2.259,20 | Isento (0%) | R$ 0,00 |
| De R$ 2.259,21 até R$ 2.826,65 | 7,5% | R$ 169,44 |
| De R$ 2.826,66 até R$ 3.751,05 | 15,0% | R$ 381,44 |
| De R$ 3.751,06 até R$ 4.664,68 | 22,5% | R$ 662,77 |
| Acima de R$ 4.664,68 | 27,5% | R$ 896,00 |

- **Valor do IRRF:** $\max\left(0,\; (\text{Base IRRF} \times \text{Alíquota}) - \text{Parcela a Deduzir}\right)$.

### 2.4. FGTS, Encargos Patronais e Provisões Mensais
- **FGTS Mensal (`aliquota_fgts` = 8%):** $\text{Base FGTS} \times 0,08$ (encargo da empresa depositado na conta vinculada do trabalhador; não é descontado do salário líquido).
- **Encargos Patronais Regime Geral (35,8% total parametrizado):**
  - INSS Patronal (`aliquota_inss_patronal`): 20,0%
  - RAT (`aliquota_rat`): 2,0%
  - Terceiros / Outras Entidades (`aliquota_terceiros`): 5,8%
  - FGTS (`aliquota_fgts`): 8,0%
- **Provisão Mensal de 13º Salário:** $\frac{\text{Salário Base}}{12} \times (1 + 0,358)$.
- **Provisão Mensal de Férias + 1/3 Constitucional:** $\left(\frac{\text{Salário Base}}{12} \times \frac{4}{3}\right) \times (1 + 0,358)$.

---

## 3. Separação Formal de Responsabilidades Operacionais e Legais

O sistema e sua interface deixam explícita a distinção entre as 7 esferas abaixo:

| Esfera | Status no Sistema | Explicação Clara ao Usuário |
|---|---|---|
| **1. Cálculo Interno** | **Executado pelo Sistema** | Apuração matemática de proventos, descontos, bases, encargos e provisões conforme parâmetros vigentes. |
| **2. Fechamento Interno** | **Executado pelo Sistema** | Congelamento administrativo da competência no banco Neon após revisão e aprovação de perfil autorizado (`RH/Admin`). |
| **3. Emissão de Demonstrativos** | **Executado pelo Sistema** | Geração de holerites individuais (HTML/PDF) e resumos gerenciais de folha e provisões. |
| **4. Obrigações Acessórias (Preparação)** | **Apenas Prévia / Conferência** | Geração local de arquivos estruturados (`JSON`/`TXT`) no leiaute conceitual dos eventos `S-1000`, `S-2200`, `S-2230` e `S-1200`. |
| **5. Integrações Oficiais (Transmissão)** | **Fora do Escopo Automático** | O fechamento interno no sistema **não transmite** eventos automaticamente ao Portal do eSocial, Receita Federal ou Caixa. |
| **6. Recolhimentos de Guias (DARF/FGTS)** | **Externo ao Sistema** | A emissão e quitação de DARF Previdenciário/IRRF (DCTFWeb) e GRF/FGTS Digital dependem dos sistemas oficiais e bancários. |
| **7. Efetivação Bancária de Pagamentos** | **Externo ao Sistema** | O sistema apura o valor líquido e emite o recibo, mas a transferência bancária (PIX/TED/Folha) ocorre no banco da empresa. |
