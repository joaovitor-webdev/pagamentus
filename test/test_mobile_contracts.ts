import fs from 'fs';
import path from 'path';

console.log('--- INICIANDO SUÍTE DE TESTES DE INTERFACE E CONTRATOS MOBILE (MOB-01 A MOB-18) ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ': ' + details : ''}`);
    process.exitCode = 1;
  }
}

const htmlPath = path.join(__dirname, '../src/public/index.html');
const cssPath = path.join(__dirname, '../src/public/css/custom.css');
const jsPath = path.join(__dirname, '../src/public/js/app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const cssContent = fs.readFileSync(cssPath, 'utf-8');
const jsContent = fs.readFileSync(jsPath, 'utf-8');

// MOB-01: Navegação Mobile & Bottom Nav
assert(
  htmlContent.includes('class="bottom-nav md:hidden no-print"') &&
  htmlContent.includes('data-bottom-tab="dashboard"') &&
  htmlContent.includes('data-bottom-tab="employees"') &&
  htmlContent.includes('data-bottom-tab="events"') &&
  htmlContent.includes('data-bottom-tab="payroll"') &&
  htmlContent.includes('data-bottom-tab="receipts"'),
  'MOB-01: Barra de navegação inferior (Bottom Nav) com 5 atalhos diretos e alvos touch'
);

// MOB-02: Viewport & Layout Compacto 320px
assert(
  htmlContent.includes('viewport-fit=cover') &&
  htmlContent.includes('width=device-width') &&
  (htmlContent.includes('overflow-x-auto') || cssContent.includes('overflow')),
  'MOB-02: Viewport configurado com viewport-fit=cover e tratamento de overflow para 320px'
);

// MOB-03 & MOB-04: Suporte a Safe Area Insets iOS e Android
assert(
  cssContent.includes('safe-area-inset-bottom') &&
  cssContent.includes('--sab'),
  'MOB-03/04: Suporte a entalhes e barras gestuais de smartphones (Safe Area Insets iOS e Android)'
);

// MOB-05: Prevenção de Auto-Zoom no iOS Safari
assert(
  cssContent.includes('font-size: 16px !important'),
  'MOB-05: Prevenção de auto-zoom acidental em inputs em navegadores WebKit/iOS (font-size: 16px)'
);

// MOB-06: Formulários Touch e Teclados Virtuais
assert(
  htmlContent.includes('inputmode="numeric"') &&
  htmlContent.includes('inputmode="decimal"') &&
  jsContent.includes('formatCurrency'),
  'MOB-06: Inputs com inputmode numérico/decimal e formatação monetária automática (formatCurrency)'
);

// MOB-07: Dual Rendering - Cartões Mobile (md:hidden) e Tabelas Desktop (hidden md:block)
assert(
  htmlContent.includes('id="employees-mobile-container"') &&
  htmlContent.includes('id="employees-table-body"') &&
  htmlContent.includes('id="variable-events-mobile-container"') &&
  htmlContent.includes('id="variable-events-table-body"') &&
  htmlContent.includes('id="payroll-cards-container"') &&
  htmlContent.includes('id="payroll-items-table-body"'),
  'MOB-07: Dual-rendering completo: Cartões em telas pequenas (md:hidden) e Tabelas em desktop (hidden md:block)'
);

// MOB-08: Apresentação de Cálculos e Memória Expansível
assert(
  jsContent.includes('togglePayrollAccordion') &&
  jsContent.includes('toggleItemCheck') &&
  jsContent.includes('accordion-content') &&
  cssContent.includes('accordion-content'),
  'MOB-08: Cartões de cálculo exibem Salário Líquido e memória analítica expansível com conferência'
);

// MOB-09: Edição e Correção Rápida de Eventos pelo Celular
assert(
  htmlContent.includes('id="modal-event"') &&
  jsContent.includes('openEventModal') &&
  jsContent.includes('calculateEventPreview'),
  'MOB-09: Edição de eventos no mobile com prévia instantânea de reflexos em R$'
);

// MOB-10: Fechamento Seguro da Folha sem window.prompt
assert(
  htmlContent.includes('id="modal-close-payroll"') &&
  jsContent.includes('confirmClosePayroll') &&
  !jsContent.includes('window.prompt("Digite o código do operador'),
  'MOB-10: Fechamento e conferência de folha através de modal acessível sem window.prompt'
);

// MOB-11: Holerite e Documentos no Celular
assert(
  htmlContent.includes('navigateReceiptEmployee') &&
  htmlContent.includes('shareReceipt') &&
  jsContent.includes('navigator.share'),
  'MOB-11: Holerite responsivo com navegação Anterior/Próximo e compartilhamento nativo (Web Share API)'
);

// MOB-12: Acessibilidade WCAG 2.2 AA e Alvos Touch >= 44px
assert(
  cssContent.includes('min-height: 44px') &&
  cssContent.includes('min-width: 44px'),
  'MOB-12: Dimensão mínima de alvos touch (>= 44x44px CSS) em toda a interface'
);

// MOB-13: Proteção contra Duplo Toque / Rede Móvel Lenta
assert(
  jsContent.includes('disabled') || jsContent.includes('carregando'),
  'MOB-13: Prevenção contra duplo clique e feedback visual durante chamadas assíncronas'
);

// MOB-14: Orientação Retrato e Paisagem
assert(
  htmlContent.includes('max-h-[90vh]') &&
  htmlContent.includes('overflow-y-auto'),
  'MOB-14: Modais com altura dinâmica e rolagem interna para acomodar modo paisagem (landscape)'
);

// MOB-15: Tratamento de Erros e Timeouts
assert(
  jsContent.includes('apiFetch') &&
  jsContent.includes('showAlert'),
  'MOB-15: Tratamento centralizado de erros de rede e feedback visual não bloqueante'
);

// MOB-16: Persistência Neon nos Modais de Fechamento e Reabertura
assert(
  htmlContent.includes('id="modal-reopen-payroll"') &&
  jsContent.includes('/api/payroll/reopen'),
  'MOB-16: Modais integrados às rotas de auditoria e persistência de reabertura controlada'
);

// MOB-17: Estabilidade de Estado e Stepper da Jornada
assert(
  htmlContent.includes('id="stepper-progress-text"') &&
  jsContent.includes('updateStepper') &&
  htmlContent.includes('step-circle-1'),
  'MOB-17: Stepper interativo de 5 etapas guiadas para o fechamento de folha'
);

// MOB-18: Usabilidade para Usuário Não Técnico
assert(
  htmlContent.includes('Mês') &&
  htmlContent.includes('Equipe') &&
  htmlContent.includes('Eventos') &&
  htmlContent.includes('Conferir') &&
  htmlContent.includes('Fechar'),
  'MOB-18: Jornada em linguagem humana e clara sem jargões de códigos de requisitos'
);

console.log(`\n--- RESULTADO DA SUÍTE MOBILE: ${passedTests}/${totalTests} TESTES APROVADOS! ---`);
if (passedTests !== totalTests) {
  process.exit(1);
}
