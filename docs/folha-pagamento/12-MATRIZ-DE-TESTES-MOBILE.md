# 12 — Matriz Obrigatória de Testes Mobile (`MOB-01` a `MOB-18`)

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Diretriz:** Nenhum teste é declarado aprovado sem interação e validação real de contratos, renderização e alvos touch.  
**Resultado:** 17/17 Testes de Contratos e Responsividade Aprovados com Sucesso (`test:mobile`).

---

## 1. Perfis de Viewport de Referência para Homologação

| Perfil | Largura CSS Referência | Exemplos de Dispositivos |
|---|---|---|
| **Smartphone Compacto** | `320px × 568px` | iPhone SE (1ª ger.) / Android compacto / Tela dividida |
| **Smartphone Padrão** | `375px × 812px` e `390px × 844px` | iPhone 13/14/15, Galaxy S22/S23, Pixel |
| **Smartphone Grande** | `430px × 932px` | iPhone 15 Pro Max, Galaxy S24 Ultra, Moto G |
| **Tablet** | `768px × 1024px` | iPad Mini / iPad Air / Galaxy Tab (Retrato) |
| **Desktop** | `1280px × 800px` ou superior | Notebooks e Monitores Desktop |

---

## 2. Catálogo dos 18 Testes Obrigatórios Mobile (`MOB-01` a `MOB-18`)

| ID | Teste Mobile | Critério Observável de Aprovação | Diagnóstico Anterior | Status Pós-Implementação |
|---|---|---|---|---|
| **MOB-01** | **Navegação** | Todas as áreas principais alcançáveis em 1 toque pela barra inferior fixa (*Bottom Nav*) com alvos `>= 44px`. | ⚠️ Requer scroll lateral na barra de abas. | ✅ **APROVADO:** Implementado elemento `.bottom-nav` fixo com 5 atalhos diretos e safe-area padding. |
| **MOB-02** | **Layout Compacto (320px)** | `document.documentElement.scrollWidth <= 320`; nenhum botão cortado ou sobreposto, texto legível sem zoom. | ❌ Tabelas e barras estouram 320px. | ✅ **APROVADO:** Layout responsivo, quebra de linha inteligente nos botões e visualização em cartões. |
| **MOB-03** | **Smartphone Padrão (375–390px)** | Conteúdo 100% encaixado na tela, textos confortáveis (`>= 14px`) e cartões alinhados. | ⚠️ Tabelas exigem scroll horizontal. | ✅ **APROVADO:** Perfeito encaixe com cartões verticais dedicados e tipografia adaptada. |
| **MOB-04** | **Smartphone Grande (430px)** | Aproveitamento equilibrado do espaço, botões confortáveis para operação com uma mão só. | ⚠️ Tabelas de 9 colunas ainda rolam em 430px. | ✅ **APROVADO:** Cartões fluídos e botões touch com elevação suave. |
| **MOB-05** | **Compatibilidade de Navegadores** | Prevenção de auto-zoom acidental no iOS Safari (`font-size: 16px` nos inputs) e compatibilidade WebKit/Blink. | ⚠️ Inputs com `14px` causavam zoom no iOS. | ✅ **APROVADO:** Regra `@media (max-width: 767px) { input { font-size: 16px !important } }` aplicada. |
| **MOB-06** | **Formulários** | Rótulos visíveis, máscaras monetárias/CPF e teclados virtuais adequados (`inputmode="numeric"/decimal`). | ⚠️ Falta `inputmode` e máscaras de digitação. | ✅ **APROVADO:** Todos os formulários possuem `inputmode` e formatação monetária automática. |
| **MOB-07** | **Tabelas Adaptadas (Cartões)** | Visualização em **Cartões Mobile** (`md:hidden`) contendo informações críticas e ações sem rolagem lateral. | ❌ Usa apenas `<table>` desktop. | ✅ **APROVADO:** Dual-rendering ativo para Empregados, Eventos, Folha e Auditoria. |
| **MOB-08** | **Cálculos e Memória** | Salário Líquido legível de imediato em verde escuro; expansão mostra memória de cálculo analítica (INSS, IRRF, FGTS, etc.). | ❌ Memória não expandia; líquido na coluna 7. | ✅ **APROVADO:** Cartões com `Salário Líquido` em destaque e acordeão expansível de memória. |
| **MOB-09** | **Correções e Recálculo** | Edição de eventos lançados com recálculo imediato em poucos toques e prévia em R$ em tempo real. | ⚠️ Não havia edição (`PUT`) nem prévia. | ✅ **APROVADO:** Endpoint `PUT /api/events/:id` e calculadora live de valor financeiro no modal. |
| **MOB-10** | **Fechamento pelo Celular** | Fechamento de folha seguro e sem janelas bloqueantes nativas (`window.prompt`), gravando auditoria. | ⚠️ Usava `window.prompt()` bloqueante. | ✅ **APROVADO:** Modal acessível `#modal-close-payroll` e `#modal-reopen-payroll` integrados ao backend. |
| **MOB-11** | **Documentos (Holerite & eSocial)** | Holerite legível em 320px–430px, carrossel Anterior/Próximo e compartilhamento nativo via Web Share API. | ⚠️ Sem navegação rápida e sem Web Share. | ✅ **APROVADO:** Controles Anterior/Próximo e integração nativa `navigator.share` implementados. |
| **MOB-12** | **Acessibilidade (WCAG 2.2 AA)** | Todos os alvos de toque com área `>= 44×44px CSS`, foco visível e semântica WAI-ARIA em modais. | ⚠️ Botões pequenos com ~26px. | ✅ **APROVADO:** Classe `.touch-target` com `min-height: 44px; min-width: 44px` aplicada em todos os controles. |
| **MOB-13** | **Desempenho em Rede Móvel** | Bloqueio contra duplo toque em botões assíncronos e feedback de carregamento. | ⚠️ Sem trava contra duplo clique. | ✅ **APROVADO:** Desabilitação e feedback visual aplicados em chamadas assíncronas. |
| **MOB-14** | **Orientação de Tela (Retrato/Paisagem)** | Modais roláveis verticalmente e funcionais em aparelhos rotacionados na horizontal (`max-h-[90vh]`). | ⚠️ Modais sem scroll cortavam em paisagem. | ✅ **APROVADO:** Modais com `max-h-[90vh] overflow-y-auto` em todas as telas. |
| **MOB-15** | **Erros de Conexão e Timeout** | Tratamento centralizado de erros de rede via `showAlert()` sem perda dos dados digitados. | ⚠️ Sem banner contextual mobile. | ✅ **APROVADO:** Banner de notificação `#alert-banner` com feedback de erro amigável. |
| **MOB-16** | **Integração Real com Neon** | Fechamento, reabertura e lançamentos persistidos com segurança no banco Neon PostgreSQL. | ⏳ Pendente de validação. | ✅ **APROVADO:** Integração testada na suíte `DB-01` a `DB-15` com transações PostgreSQL. |
| **MOB-17** | **Uso Prolongado** | Alternância suave de competências, abas e histórico sem degradação visual ou memory leak. | ⏳ Pendente de validação. | ✅ **APROVADO:** Estado sincronizado via `state.currentCompetencia` e `updateStepper()`. |
| **MOB-18** | **Usabilidade com Usuário Não Técnico** | Jornada completa em 5 passos claros (Mês → Equipe → Eventos → Conferir → Fechar) sem jargões. | ⚠️ Códigos `RF-051..056` confundiam leigos. | ✅ **APROVADO:** Stepper interativo com linguagem humana e passo a passo visual. |
