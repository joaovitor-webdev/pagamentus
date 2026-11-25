# Guia de Homologação, Treinamento e Implantação — Pagamentus (SPEC-5.12)

> **Aviso Obrigatório (RB-010):** O sistema **não promete conformidade automática**. Todas as tabelas tributárias, fórmulas, alíquotas, integrações e obrigações acessórias exigem **manutenção contínua e validação por profissional autorizado** antes de qualquer uso oficial ou transmissão.

## 1. Checklist de Implantação
1. Configurar variáveis de ambiente a partir de `.env.example` (nunca versionar `.env` real).
2. Instalar dependências com `npm install`.
3. Validar compilação TypeScript com `npm run build`.
4. Executar a suíte de testes automatizados com `npm test`.
5. Iniciar o servidor com `npm start` (ou `npm run dev` em ambiente de homologação).

## 2. Roteiro de Homologação
- **Plataforma e Segurança (Item 1):** Validar autenticação, MFA, isolamento por cliente e trilha de auditoria.
- **Contabilidade e Financeiro (Item 2):** Validar plano de contas, lançamentos com partidas dobradas, conciliação e demonstrações.
- **Fiscal e Imposto de Renda (Item 3):** Validar parametrização de regras versionadas, cálculo com memória, aprovação profissional obrigatória (`RB-003`) e consistência de IRPF/IRPJ.
- **Folha, Obrigações e Portal (Item 4):** Validar tarefas, painel de obrigações, alertas com aviso `RB-009`, portal do cliente e políticas de retenção/consentimentos.

## 3. Plano de Treinamento
- **Equipe Contábil/Fiscal:** Uso das telas/APIs de parametrização por exercício, conferência de divergências, memória de cálculo e aprovação profissional.
- **Equipe de Atendimento/DP:** Gestão de tarefas, painel de obrigações, checklist documental e solicitações de correção no portal.
- **Clientes:** Envio de documentos e acompanhamento de solicitações pelo Portal do Cliente.
