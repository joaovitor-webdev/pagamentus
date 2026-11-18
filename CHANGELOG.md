# Changelog
Uma linha por spec concluída, no estilo Keep a Changelog.

## [Não lançado]
### Adicionado
- SPEC-1.1: Estrutura base de documentação, modelos de especificação e regras de proteção da branch main.
- SPEC-1.2: Definição da stack tecnológica oficial, diretrizes de escalabilidade (ADR-001) e segregação de ambientes de teste e produção.
- SPEC-1.3: Modelo de dados inicial com chaves, restrições e controle transacional atômico com rollback (RNF-013).
- [SPEC-1.4] Autenticação, senhas e MFA (PR #14, João Vitor): Política de senhas fortes, MFA para perfis privilegiados, bloqueio de tentativas e encerramento de sessões (RF-075, RNF-003).
- [SPEC-1.5] Perfis, permissões e isolamento entre clientes (PR #15, João Vitor): Segregação entre clientes com autorização expressa, menor privilégio, criptografia de dados sensíveis e TLS (RB-008, RNF-001).
- SPEC-2.1: Estrutura e manutenção de plano de contas contábil configurável por empresa com validação de lançamentos em contas analíticas.
- SPEC-2.2: Lançamentos manuais estruturados com partidas dobradas, validação de período aberto, contas ativas e consistência de valores.
- SPEC-2.3: Modelos de lançamentos recorrentes, rateios proporcionais e estornos com rastreabilidade ao lançamento de origem.
- SPEC-2.4: Importação de lançamentos em lote por planilha com pré-validação, relatório de erros por linha e opção de desfazer lote.
- SPEC-5.1: Especificação em revisão de navegação, responsividade, acessibilidade, compatibilidade com navegadores, exportações em formatos abertos e documentação de requisitos de integração.
- SPEC-4.3: Portal de documentos do cliente com upload, filtros, checklist, confirmação de recebimento, correção e auditoria.

### Alterado

### Corrigido
