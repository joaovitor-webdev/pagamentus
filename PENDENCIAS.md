# Pendências e Itens para Validação do Contador (`conferido_por_contador = false`)

## 1. Implementações de Sistema Concluídas (Fases 1 a 8)
- [x] **Fase 1 & 2 (Core, RLS, Auth e Cadastros):** multi-tenant por `escritorio_id`/`empresa_id`, 5 papéis (`ADMIN`, `CONTADOR`, `FINANCEIRO`, `RH_DP`, `CLIENTE`), auditoria automática e bucket privado `documentos`.
- [x] **Fase 3 (Folha de Pagamento 2026):** motor em `decimal.js`, INSS progressivo 2026, IRRF 2026 com redutor da Lei nº 15.270/2025, fluxo `ABERTA → CALCULADA → CONFERIDA → FECHADA`, holerite em PDF individual e histórico por empregado.
- [x] **Fase 4 (Contabilidade):** lançamentos com múltiplas partidas dobradas, apropriação automática da folha, Diário, Razão por conta, Balancete (`D`/`C`), DRE (com Receita Bruta, Deduções detalhadas e Receita Líquida) e Balanço Patrimonial (`Ativo = Passivo + PL`).
- [x] **Fase 5 (Financeiro):** títulos a pagar/receber com parcelamento e recorrência, baixa atômica (`baixar_titulo_com_contabil`) gerando lançamento `FINANCEIRO` no Diário, conciliação OFX e projeção de fluxo de caixa (30/60/90 dias).
- [x] **Fase 6 (Fiscal e IRPF):** tabelas parametrizadas (`parametros_simples_nacional`, `cnae_simples_anexo`, `parametros_lucro_presumido`, `parametros_irpf_anual`), apuração dinâmica a partir das receitas do Diário, provisão contábil (`FISCAL`) com contas próprias por tributo (`ISS`, `PIS`, `COFINS`, `IRPJ`, `CSLL`) e Comparador IRPF (`2025` × `2026`).
- [x] **Fase 7 & 8 (Obrigações, Calendário e UI/UX):** feriados móveis pelo algoritmo de Meeus/Butcher (2026–2028), motor de N-ésimo dia útil (`EFD-Contribuições`), obrigações de entrega e pagamento integradas com apurações e folha fechada, responsividade `375px`/`768px`/`1440px` com zero rolagem horizontal.

---

## 2. Itens Aguardando Validação do Contador (`conferido_por_contador = false`)

Todos os parâmetros abaixo estão cadastrados no banco com `conferido_por_contador = false` e exibem aviso até que um usuário com papel `CONTADOR` ou `ADMIN` marque como conferido:

1. **Folha de Pagamento (`parametros_legais` — Vigência 2026):**
   - Salário mínimo R$ 1.621,00 (*Decreto nº 12.797/2025*);
   - Faixas do INSS progressivo e teto de R$ 8.475,55 / contribuição máxima R$ 988,09 (*Portaria Interministerial MPS/MF nº 13/2026*);
   - Tabela mensal do IRRF e fórmula de redução de até R$ 312,89 para rendimentos até R$ 7.350,00 (*Lei nº 15.270/2025*).
2. **Regime Contábil da Baixa Financeira (`empresas.regime_contabil_baixa`):**
   - Padrão atual: `'CAIXA'` (credita Receita `3.1.*` / debita Despesa `4.*` na baixa).
   - Opção configurável por empresa: `'COMPETENCIA'` (baixa contra `1.1.03.001 Clientes a Receber` e `2.1.03.001 Fornecedores a Pagar`).
3. **Simples Nacional (`parametros_simples_nacional` e `cnae_simples_anexo`):**
   - Faixas, alíquotas nominais, parcelas a deduzir e repartição de tributos dos Anexos I a V (*LC nº 123/2006 c/ redação da LC nº 155/2016*);
   - Enquadramento de CNAEs sujeitos ao Fator R ($\ge 28\%$ → Anexo III; $< 28\%$ → Anexo V).
4. **Lucro Presumido e Reforma Tributária 2026 (`parametros_lucro_presumido`):**
   - Percentuais de presunção (32% serviços; 8% IRPJ / 12% CSLL comércio e indústria), PIS 0,65%, COFINS 3,00%;
   - Majoração de 10% na presunção sobre a parcela da receita bruta que exceder R$ 5.000.000,00/ano ou R$ 1.250.000,00/trimestre (*LC nº 224/2025*);
   - Alíquotas informativas de teste de **CBS (0,9%)** e **IBS (0,1%)** com dispensa de recolhimento quando cumpridas as obrigações acessórias (*LC nº 214/2025, art. 348*).
5. **IRPF Anual (`parametros_irpf_anual`):**
   - Tabelas progressivas anuais de **2025 (Exercício 2026)** e **2026 (Exercício 2027)**, limite do desconto simplificado anual (R$ 16.754,34 em 2025; R$ 17.640,00 em 2026) e redutor anual da *Lei nº 15.270/2025 (art. 11-A da Lei nº 9.250/1995)*.
6. **Prazos de Obrigações e Expediente Bancário (`regras_obrigacoes`, `parametros_iss_municipio` e `feriados_nacionais`):**
   - Regra de ajuste de dia útil da **EFD-Reinf** (dia 15 — antecipar vs. prorrogar conforme entendimento do escritório);
   - Dia de vencimento e regra de dia útil do **ISS Municipal** por município da empresa;
   - Pontos facultativos / dias sem expediente bancário ao público (**Carnaval**, **Corpus Christi** e **31/12 — Véspera de Ano-Novo**).
