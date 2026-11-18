# 14 — Riscos Técnicos, Legais, Operacionais e Critérios Globais de Aceite

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Data:** 18/11/2026

---

## 1. Matriz de Riscos e Medidas de Mitigação

| ID | Categoria | Risco Identificado | Probabilidade | Impacto | Medida de Prevenção e Mitigação no Plano Mestre |
|---|---|---|---|---|---|
| **R-01** | **Técnico (Módulos)** | Execução acidental dos arquivos `.js` legados de SQLite (`src/db/database.js`) em vez dos `.ts` de PostgreSQL. | Alta (no estado atual) | Crítico | **Eliminado na `ME-01`:** remoção definitiva dos 9 arquivos `.js` legados de SQLite em `src/`, mantendo exclusivamente os arquivos `.ts` tipados. |
| **R-02** | **Banco (Neon / Serverless)** | Novas conexões do `pg.Pool` no Neon Pooler não encontrarem o schema `pagamentus` ou falharem por falta de SSL. | Alta (sem ajuste) | Crítico | **Mitigado na `ME-02`:** configurar `options: '-c search_path=pagamentus,public'` e `ssl: { rejectUnauthorized: false }` diretamente no `Pool` em `src/db/database.ts`. |
| **R-03** | **Negócio / Integridade** | Alteração de eventos variáveis ou recálculo acidental de uma competência que já foi aprovada e fechada. | Média | Alto | **Mitigado na `ME-04`:** bloqueio no backend (HTTP 409) para qualquer mutação em competência `fechada`, exigindo chamada explícita a `POST /api/payroll/reopen` com justificativa e auditoria. |
| **R-04** | **Usabilidade Mobile** | Usuário em tela de 320px–390px não conseguir ler o salário líquido ou clicar em ações escondidas no fim de tabelas horizontais. | Certa (no estado atual) | Alto | **Mitigado nas `ME-07` a `ME-11`:** navegação inferior (*Bottom Nav*), cartões mobile com resumo financeiro visível sem scroll horizontal e botões com altura mínima de 44px. |
| **R-05** | **Operacional (Rede Móvel)** | Duplo toque no botão "Calcular Folha" ou "Salvar" em conexão 3G/4G lenta gerar execuções duplicadas. | Média | Médio | **Mitigado na `ME-12`:** desabilitação imediata do botão durante a requisição (`disabled = true` + texto `"Processando..."`) e timeout controlado com `AbortController`. |
| **R-06** | **Legal / Conformidade (`RB-010`)** | Usuário interpretar o status `"Folha Fechada"` ou o arquivo `"eSocial"` como transmissão oficial automática ao Governo Federal. | Baixa | Alto | **Mitigado em `06-ESCOPO-E-REGRAS-DE-FOLHA.md` e na UI (`ME-10`):** avisos explícitos no modal de fechamento e na aba eSocial diferenciando fechamento/conferência interna de transmissão governamental. |
| **R-07** | **Privacidade (LGPD / `RNF-002`)** | Exposição de CPFs ou salários para perfis não autorizados ou uso de dados pessoais reais em ambiente de demonstração. | Baixa | Alto | **Preservado e Validado:** `maskingService.ts` mascara 38 campos monetários e CPFs na própria resposta da API para `consulta_assistente`, e o seed usa dados 100% fictícios. |

---

## 2. Critérios Observáveis de Qualidade da Experiência Mobile (Seção 15)

| Dimensão | Resultado Esperado | Critério Observável e Mensurável de Aprovação |
|---|---|---|
| **Navegação** | Fácil e previsível | Barra inferior com 5 destinos no celular (`< 768px`); qualquer função principal alcançada em no máximo 2 toques; sem scroll horizontal de abas. |
| **Legibilidade** | Texto confortável | Fonte base `>= 14px` para dados principais e `>= 16px` em inputs de formulário (evitando zoom automático no iOS); contraste `>= 4.5:1` (WCAG AA). |
| **Formulários** | Curtos e claros | Organização vertical em coluna única no mobile, `<label>` persistente acima de cada campo, `inputmode` apropriado e máscara automática de CPF. |
| **Botões** | Confortáveis para toque | Altura mínima de `44px` (`min-h-[44px]`), espaçamento mínimo de `8px` entre ações adjacentes e rótulo textual acompanhando cada ícone. |
| **Tabelas** | Adaptadas ao smartphone | Em `< 768px`, todas as 6 tabelas são substituídas por **Cartões Mobile** sem barra de rolagem horizontal (`scrollWidth <= clientWidth`). |
| **Cálculos** | Compreensíveis | Cada colaborador exibe Salário Bruto, Descontos e **Salário Líquido** em destaque no cartão, com botão para expandir a memória de cálculo completa. |
| **Fechamento** | Executável inteiramente no celular | Fluxo completo (Selecionar competência → Verificar equipe → Eventos → Calcular → Conferir → Fechar → Demonstrativos) 100% operável no smartphone com modal de confirmação claro. |
| **Documentos** | Acessíveis e legíveis | Holerite legível sem zoom em 320px+, com botões `◀ Anterior / Próximo ▶`, impressão/PDF (`@media print`) e download JSON/TXT do eSocial. |
| **Feedback** | Imediato e claro | Estados visíveis de `"Carregando..."`/`"Processando..."` nos botões e banners de sucesso/erro com `aria-live="polite"`. |
| **Erros** | Explicativos e recuperáveis | Mensagens em português claro indicando a causa e a ação corretiva, sem apagar os dados já preenchidos no formulário. |
| **Performance** | Satisfatória em celulares intermediários | LCP `< 2,5s`, INP `< 200ms`, CLS `< 0,1`; zero requisições redundantes e bloqueio contra duplo clique. |
| **Acessibilidade** | Requisitos aplicáveis verificados | Conformidade WCAG 2.2 AA verificada: navegação por teclado, `Escape` nos modais, `role="dialog"`, `label` explícito e informação nunca restrita apenas à cor. |
| **Persistência** | Neon integrado e validado | 100% dos testes `DB-01` a `DB-15` aprovados contra o banco PostgreSQL/Neon. |
| **Usabilidade** | Verificada por tarefas reais | Conclusão integral do cenário de 18 passos da Seção 14 e do roteiro `MOB-18` sem necessidade de desktop. |

---

## 3. Critérios Globais de Aceite (`AC-01` a `AC-18`)

| Código | Critério Global | Condição Objetiva de Comprovação |
|---|---|---|
| **AC-01** | **Reaproveitamento** | Preservação integral da arquitetura Express + PostgreSQL + SPA Vanilla JS/Tailwind dos alunos, removendo apenas os 9 arquivos `.js` legados duplicados de SQLite. |
| **AC-02** | **Funcionalidade** | Ciclo completo de 14 etapas da folha (da empresa ao histórico) implementado e operacional. |
| **AC-03** | **Banco** | Neon PostgreSQL configurado como persistência principal no schema `pagamentus`. |
| **AC-04** | **Integridade** | Chaves primárias, FKs compostas tenant-aware, constraints `UNIQUE`/`CHECK` e transações ACID validadas. |
| **AC-05** | **Cálculos** | Casos de referência `CR-01`, `CR-02` e `CR-03` (INSS, IRRF, FGTS, HE, Faltas, Benefícios, Férias, 13º e Provisões) validados ao centavo. |
| **AC-06** | **Fechamento** | Competência fechada bloqueia mutações e recálculos (HTTP 409), exigindo reabertura controlada com justificativa e log. |
| **AC-07** | **Documentos** | Holerites individuais e exportações eSocial (`JSON`/`TXT`) gerados e consultáveis no celular e desktop. |
| **AC-08** | **Hospedagem** | Configuração `vercel.json` + `api/index.ts` pronta e validada para deploy serverless na Vercel. |
| **AC-09** | **Segurança** | Credenciais isoladas em variáveis de ambiente (`.env`), queries 100% parametrizadas e RBAC/LGPD ativo (`maskingService.ts`). |
| **AC-10** | **Mobile First** | Todas as jornadas essenciais operáveis em smartphones (`320px`, `375px`, `430px`). |
| **AC-11** | **UX** | Linguagem clara para pessoas não técnicas, com *Stepper* de progresso e prévia automática de valores. |
| **AC-12** | **Responsividade** | Ausência de rolagem horizontal indevida, textos cortados ou elementos sobrepostos de `320px` a `1280px+`. |
| **AC-13** | **Performance** | Metas de carregamento, responsividade ao toque e proteção contra duplo clique validadas. |
| **AC-14** | **Acessibilidade** | Critérios WCAG 2.2 AA verificados em formulários, botões, modais e alertas. |
| **AC-15** | **Persistência** | Dados permanecem acessíveis após encerramento de sessão, reinicialização do servidor e novos ciclos de execução. |
| **AC-16** | **Documentação** | Todos os 15 documentos obrigatórios (`01` a `15`) mantidos e atualizados em `docs/folha-pagamento/`. |
| **AC-17** | **Conformidade** | Parâmetros legais e limites do sistema (separação entre fechamento interno e obrigações externas) explicitamente documentados. |
| **AC-18** | **Jornada Mobile Completa** | Execução comprovada dos 18 passos da Seção 14 do início ao fim pelo celular, sem depender de computador. |
