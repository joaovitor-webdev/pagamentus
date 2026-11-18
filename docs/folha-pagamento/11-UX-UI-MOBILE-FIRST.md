# 11 — Auditoria e Projeto de UX/UI Mobile First

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Arquivos Auditados:** `src/public/index.html` (921 linhas), `src/public/css/custom.css` (42 linhas), `src/public/js/app.js` (971 linhas).

---

## 1. Matriz de Auditoria Mobile das Telas Existentes (Seção 4)

Abaixo está o diagnóstico real de cada tela e modal da aplicação atual, avaliado para os 5 perfis de referência (**320px**, **375–390px**, **430px**, **768px** e **1280px+**):

| Tela / Componente (`src/public/index.html`) | Classificação Atual no Mobile (320px–430px) | Evidências Técnicas no Código | Problemas Observados em Smartphones (320px, 375px, 430px) |
|---|---|---|---|
| **Cabeçalho & Navegação (`header` L40–99)** | **MOBILE COM PROBLEMAS IMPORTANTES** | `index.html` L42 (`flex justify-between h-16`) e L75 (`nav class="flex space-x-1 ... overflow-x-auto"`). | Em 320px–390px, o título longo `"Sistema Integrado de Contabilidade"` + badge `"Item 4 · SPEC-4.1"` + seletor de perfil RBAC colidem no topo. As 7 abas (`Dashboard`, `Empregados (RF-051)`, ..., `Auditoria & Parâmetros (RF-056)`) somam `> 980px` de largura, escondendo as últimas 4 abas fora da tela e exigindo rolagem lateral no topo. |
| **Aba 1: Dashboard (`#tab-dashboard` L113–187)** | **MOBILE UTILIZÁVEL COM AJUSTES** | `index.html` L115 (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), L155 (`flex-col md:flex-row`). | Os 4 cards de indicadores empilham bem em 1 coluna no celular, mas falta: (1) Cartão de dados da Empresa Empregadora; (2) Seletor rápido de competência no próprio painel; (3) Guia visual de progresso da folha (*Stepper* do que falta fazer para fechar o mês). |
| **Aba 2: Empregados (`#tab-employees` L190–226)** | **MOBILE COM PROBLEMAS IMPORTANTES** | `index.html` L204 (`table class="min-w-full..."` com 9 colunas `<th>`); `app.js` L252 (`px-2.5 py-1 text-xs`). | **Tabela de 9 colunas** (Nome, CPF, Cargo, Salário Base, Jornada, Admissão, Dependentes, Status, Ações). Em 320px–430px, o usuário só vê Nome e CPF e precisa rolar horizontalmente para ver o salário e alcançar os botões `Editar`, `Licença` e `Inativar` (que têm ~26px de altura, abaixo dos 44px exigidos para toque). Não há busca por nome nem botão para Benefícios. |
| **Aba 3: Eventos & Afastamentos (`#tab-events` L229–334)** | **MOBILE COM PROBLEMAS IMPORTANTES** | `index.html` L246 (3 sub-abas em linha), L261 (tabela 7 colunas), L291 (tabela 5 colunas), L314 (tabela 6 colunas). | Em 320px, os 3 botões de sub-aba (`Eventos da Competência`, `Afastamentos e Licenças`, `Histórico Contratual`) quebram/apertam; as 3 listagens são tabelas horizontais; o botão `Excluir` evento tem ~24px de altura (`px-2 py-1 text-xs`, `app.js` L430) e não há botão `Editar`. |
| **Aba 4: Cálculo e Fechamento (`#tab-payroll` L337–427)** | **MOBILE COM PROBLEMAS IMPORTANTES** | `index.html` L375 (`grid-cols-2 md:grid-cols-5`), L405 (tabela 9 colunas); `app.js` L675 (`prompt(...)`). | Os 5 cards de resumo funcionam em `grid-cols-2`, porém a lista de resultados por funcionário (`#payroll-items-table-body`) é uma **tabela de 9 colunas**. No celular, é impossível ver o Nome do colaborador (coluna 1) e seu Salário Líquido (coluna 7) ao mesmo tempo. Além disso, a memória de cálculo (`inssDetalhes`, `irrfDetalhes`) não pode ser expandida na tela, e os botões de Aprovar/Fechar usam `window.prompt()` nativo sem mostrar o resumo financeiro da confirmação. |
| **Aba 5: Holerite & Provisões (`#tab-receipts` L430–579)** | **MOBILE UTILIZÁVEL COM AJUSTES** | `index.html` L436 (`flex items-center space-x-2` sem `flex-wrap`), L451 (`#printable-holerite`), L487 (tabela 5 colunas). | Na barra de controles (L436), o `<select>` de empregado + `<input type="month">` + botão `Visualizar` + botão `Imprimir` estão em uma linha `flex` sem `flex-wrap`, estourando a largura de 320px–375px! O holerite tem textos `text-[11px]` e linha de assinatura `w-64` que aperta em 320px. Faltam botões `◀ Anterior / Próximo ▶` para folhear recibos no celular. |
| **Aba 6: eSocial Simulado (`#tab-esocial` L582–652)** | **MOBILE UTILIZÁVEL COM AJUSTES** | `index.html` L588 (`flex items-center space-x-2` sem `flex-wrap`), L609 (`grid-cols-1 md:grid-cols-4`). | A barra de botões (Mês + `Visualizar Eventos` + `Baixar JSON` + `Baixar TXT`, L588) não tem `flex-wrap`, causando overflow horizontal em 320px–390px. Os 4 cards de eventos (`S-1000` a `S-1200`) empilham bem. |
| **Aba 7: Auditoria & Parâmetros (`#tab-audit` L655–700)** | **MOBILE UTILIZÁVEL COM AJUSTES** | `index.html` L663 (`grid-cols-1 lg:grid-cols-3`), L668 (tabela de 5 colunas). | O grid principal empilha em 1 coluna, mas a trilha de auditoria é uma tabela de 5 colunas com scroll horizontal no celular, os parâmetros não possuem botão de edição para `rh_admin` e falta a lista de Competências Fechadas (Histórico de Folhas). |
| **Modais 1 a 4 (`#modal-employee`, `#modal-event`, `#modal-leave`, `#modal-simulation` L707–916)** | **MOBILE UTILIZÁVEL COM AJUSTES** | `index.html` L784 (`grid-cols-2`), L803 (`grid-cols-3`), L851 (`grid-cols-2`), L881 (`grid-cols-2`). | Em `#modal-event` L803, `grid-cols-3` espreme `Horas/Dias`, `Percentual (%)` e `Valor (R$)` em 320px; os modais não têm `max-h-[90vh] overflow-y-auto`, podendo cortar o botão "Salvar" quando o teclado virtual do smartphone abre! |

---

## 2. Diretrizes do Projeto Mobile First (Sem Reescrever a Stack)

Preservando integralmente a stack **HTML5 + Tailwind CSS + Vanilla JS** dos alunos, aplicaremos as seguintes soluções de design e engenharia Mobile First na **Fase E (`ME-07` a `ME-11`)**:

### 2.1. Navegação Mobile Inferior (*Bottom Navigation Bar*) + Barra Global de Competência
- **No Smartphone (`< 768px`):**
  - Barra fixa inferior (`fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] md:hidden`) com 5 ícones + rótulos legíveis e alvos de toque de `56px` de altura:
    1. **Início** (Resumo, Empresa e Guia da Jornada)
    2. **Equipe** (Funcionários, Contratos e Benefícios)
    3. **Eventos** (Horas Extras, Faltas, Afastamentos e Ponto)
    4. **Folha** (Calcular, Conferir e Fechar Competência)
    5. **Recibos** (Holerites, Histórico e eSocial)
  - **Barra Global de Competência** sempre visível logo abaixo do cabeçalho: exibe o seletor de mês (`2026-11`), o status atual (`Rascunho` / `Aprovada` / `Fechada`) e um indicador rápido da etapa atual.
- **No Desktop (`>= 768px`):**
  - Mantém a navegação horizontal por abas no topo, limpa de códigos técnicos desnecessários.

### 2.2. Substituição de Tabelas Horizontais por Cartões Mobile com Detalhamento Progressivo
- **Padrão Responsivo Dual (`Cartões no Mobile` + `Tabela no Desktop`):**
  - Em todas as listagens (Funcionários, Eventos, Afastamentos, Histórico Contratual, Itens da Folha e Logs de Auditoria), o container mobile (`block md:hidden space-y-3`) renderiza **Cartões Estruturados**, enquanto a `<table>` original permanece em `hidden md:block` para uso em telas grandes.
- **Estrutura do Cartão de Conferência da Folha no Celular:**
  ```text
  +-------------------------------------------------------------------+
  | Carlos Eduardo Santos                         [✓ Conferido]       |
  | Analista Contábil Pleno · 40h · 2 dep                             |
  | ⚠️ Alerta: Possui 8h extras lançadas nesta competência            |
  |-------------------------------------------------------------------|
  |  PROVENTOS BRUTOS     |    DESCONTOS (-)    |  SALÁRIO LÍQUIDO    |
  |   R$ 5.512,00         |     R$ 949,75       |   R$ 4.562,25       |
  |-------------------------------------------------------------------|
  | [▼ Ver Memória de Cálculo (INSS, IRRF, FGTS, Rubricas)]           |
  |-------------------------------------------------------------------|
  | [ ✓ Conferir ]      [ ✏️ Eventos ]      [ 📄 Ver Holerite ]       |
  +-------------------------------------------------------------------+
  ```

### 2.3. Formulários e Modais Projetados para Toque e Teclado Virtual
- **Altura e Alvos de Toque:** Todos os botões, `<input>` e `<select>` terão altura mínima de **44px a 48px** (`min-h-[44px] py-2.5 px-3.5 text-base sm:text-sm` — usar `16px` no mobile evita o auto-zoom forçado do iOS Safari ao focar em um campo!).
- **Teclado Virtual Adequado:**
  - CPF: `inputmode="numeric"` com formatação automática `000.000.000-00`;
  - Salário, Valores e Horas: `inputmode="decimal"`;
  - Dependentes e Dias: `inputmode="numeric"`.
- **Modais Estilo *Bottom Sheet* no Celular:**
  - Posicionados na base da tela em smartphones (`items-end sm:items-center`) com `max-h-[90dvh] overflow-y-auto`, cabeçalho fixo e rodapé de botões sempre acessível mesmo com o teclado virtual aberto.

### 2.4. Fluxo de Fechamento da Folha pelo Celular (Sem `window.prompt`)
- Ao tocar em **"✅ Aprovar Folha"** ou **"🔒 Fechar Competência"**, abre-se um **Modal de Confirmação de Fechamento** claro, mostrando:
  - Competência selecionada (`2026-11`);
  - Quantidade de colaboradores processados e conferidos;
  - Resumo financeiro final (Total Bruto, Total Descontos, **Total Líquido a Pagar**, Total Encargos);
  - Aviso claro sobre o congelamento da competência contra edições acidentais;
  - Campo de justificativa/observação amigável e botão de confirmação protegido contra toque acidental.

### 2.5. Acessibilidade (WCAG 2.2 Nível AA) e Performance Mobile
- **Contraste:** Paleta `slate-900`/`slate-700` sobre branco, `emerald-800` sobre `emerald-50`, `rose-800` sobre `rose-50` e `amber-900` sobre `amber-50` (razão de contraste `> 4.5:1`).
- **Sem Dependência Exclusiva de Cor:** Todos os badges e alertas possuem texto explícito e ícone semântico (`🛡️ Acesso Total`, `👁️ Dados Mascarados`, `📝 Rascunho`, `✅ Aprovada`, `🔒 Fechada`).
- **Prevenção de Duplo Toque e Feedback:** Botões de cálculo, salvamento e fechamento exibem estado `"Processando..."` e ficam `disabled` enquanto a requisição está em andamento.
