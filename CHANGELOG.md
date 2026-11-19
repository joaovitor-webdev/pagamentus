# Changelog
Uma linha por spec concluída, no estilo Keep a Changelog.

## [Não lançado]
### Adicionado
- SPEC-1.1: Estrutura base de documentação, modelos de especificação e regras de proteção da branch main.
- SPEC-1.2: Definição da stack tecnológica oficial, diretrizes de escalabilidade (ADR-001) e segregação de ambientes de teste e produção.
- SPEC-1.3: Modelo de dados inicial com chaves, restrições e controle transacional atômico com rollback (RNF-013).
- [SPEC-1.4] Autenticação, senhas e MFA (PR #14, João Vitor): Política de senhas fortes, MFA para perfis privilegiados, bloqueio de tentativas e encerramento de sessões (RF-075, RNF-003).
- [SPEC-1.5] Perfis, permissões e isolamento entre clientes (PR #15, João Vitor): Segregação entre clientes com autorização expressa, menor privilégio, criptografia de dados sensíveis e TLS (RB-008, RNF-001).
- [SPEC-1.6] Cadastro de pessoas e empresas (PR #17, João Vitor): Cadastro de PF/PJ com validação de CPF/CNPJ, inscrições, contatos, endereços, responsáveis e dados fiscais com vigência (RF-001, RF-002).
- [SPEC-1.7] Estabelecimentos, filiais, sócios e responsáveis (PR #18, João Vitor): Múltiplos estabelecimentos, filiais, sócios e responsáveis técnicos vinculados à mesma organização (RF-005).
- [SPEC-1.8] Anexos cadastrais com validade (PR #19, João Vitor): Anexação de contrato social, procurações, certificados e documentos cadastrais com controle e alerta de validade (RF-003).
- [SPEC-1.9] Auditoria e histórico cadastral (PR #20, João Vitor): Trilha de auditoria imutável para inclusão, alteração, exclusão lógica, estorno e aprovação com histórico cadastral rastreável (RF-015, RF-004, RNF-004, RB-007).
- [SPEC-1.10] Credenciais e tokens de integração (PR #21, João Vitor): Armazenamento protegido de credenciais, emissão de tokens com escopo mínimo e rotação/revogação (RF-076).
- [SPEC-1.11] Privacidade e LGPD (PR #22, João Vitor): Política LGPD (finalidade, base legal, minimização, operadores, retenção e descarte), fluxo de pedidos de titulares e registro de incidentes (RNF-002).
- [SPEC-1.12] Backup, recuperação e continuidade (PR #23, João Vitor): Backups automáticos criptografados, testes periódicos de restauração registrados, RPO/RTO e plano de continuidade/incidentes (RNF-008, RNF-016).
- [SPEC-2.1] Plano de contas (PR #6, Ítalo Natam): Estrutura e manutenção de plano de contas contábil configurável por empresa com validação de lançamentos em contas analíticas (RF-006).
- [SPEC-2.2] Lançamentos manuais com partidas dobradas (PR #12, Ítalo Natam): Lançamentos manuais estruturados com partidas dobradas, validação de período aberto, contas ativas e consistência de valores (RF-007, RF-008, RB-001).
- [SPEC-2.3] Recorrentes, rateios, provisões e estornos (PR #12, Ítalo Natam): Modelos de lançamentos recorrentes, rateios proporcionais e estornos com rastreabilidade ao lançamento de origem (RF-009).
- [SPEC-2.4] Importação de lançamentos (PR #12, Ítalo Natam): Importação de lançamentos em lote por planilha com pré-validação, relatório de erros por linha e opção de desfazer lote (RF-010).
- [SPEC-2.5] Períodos contábeis (PR #25, Ítalo Natam): Controle de períodos contábeis abertos, em fechamento e encerrados com bloqueio e reabertura mediante permissão, justificativa e auditoria (RF-012, RB-002).
- [SPEC-2.6] Centros de custo e comparativos (PR #26, Ítalo Natam): Cadastro de centros de custo, departamentos, projetos e unidades, associação a lançamentos e comparativo entre dois períodos (RF-014).
- [SPEC-2.7] Balancete, razão e diário (PR #27, Ítalo Natam): Geração de Balancete de Verificação, Livro Razão, Livro Diário e relatório auxiliar consistentes com os lançamentos (RF-013).
- [SPEC-2.8] Balanço, DRE, DFC e DMPL (PR #28, Ítalo Natam): Geração de Balanço Patrimonial, DRE, DFC e DMPL/DLPA consistentes a partir do mesmo cenário contábil (RF-013).
- [SPEC-2.9] Títulos a pagar e a receber e vínculos (PR #29, Ítalo Natam): Cadastro de títulos, parcelas, vencimentos, fornecedores/clientes, categorias, condições de pagamento e vínculos com documento fiscal, lançamento contábil, comprovante e anexos (RF-046, RF-050).
- [SPEC-2.10] Baixas, juros e inadimplência (PR #30, Ítalo Natam): Controle de pagamentos, recebimentos, baixas parciais/totais com juros, multas e descontos, estornos e marcação de inadimplência (RF-047).
- [SPEC-2.11] Conciliação contábil e bancária (PR #31, Ítalo Natam): Importação de extratos bancários com sugestão de conciliação, confirmação manual e conciliação de saldos contábeis com pagar/receber, folha e módulos fiscais (RF-011, RF-048).
- [SPEC-2.12] Fluxo de caixa e relatórios financeiros (PR #32, Ítalo Natam): Geração de fluxo de caixa, posição financeira, aging de recebíveis, previsão de pagamentos e relatório financeiro por centro de custo (RF-049).
- SPEC-5.1: Especificação em revisão de navegação, responsividade, acessibilidade, compatibilidade com navegadores, exportações em formatos abertos e documentação de requisitos de integração.
- SPEC-4.3: Portal de documentos do cliente com upload, filtros, checklist, confirmação de recebimento, correção e auditoria.
- SPEC-4.5: Aprovação da folha com trilha de sucesso e tentativas negadas, e restrição de dados salariais e de saúde por perfis simulados.

### Alterado

### Corrigido
