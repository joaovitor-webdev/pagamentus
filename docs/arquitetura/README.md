# Arquitetura e Decisões Técnicas

Este diretório armazena as Decisões de Arquitetura de Software (ADRs - Architecture Decision Records) e documentações do modelo de dados do **Sistema Integrado de Contabilidade, Fiscal e IR**.

## Estrutura esperada

- `README.md`: Este índice e orientações gerais.
- `ADR-001-stack-e-ambientes.md`: Definição de stack tecnológica, frameworks e ambientes (previsto na **SPEC-1.2**).
- `modelo-de-dados.md`: Diagramas entidade-relacionamento (DER), esquemas de tabelas e isolamento multi-inquilino / multi-organização (previsto na **SPEC-1.3**).
- `api-spec.md` ou `openapi.yaml`: Contrato de APIs e documentação OpenAPI (previsto na **SPEC-5.5**).

## Padrão para ADRs (Architecture Decision Records)

Ao registrar uma nova decisão de arquitetura, inclua:
1. **Título e Data**
2. **Status**: Proposto / Aprovado / Substituído
3. **Contexto**: O problema ou necessidade técnica que motivou a decisão.
4. **Decisão**: A tecnologia ou padrão adotado e sua justificativa.
5. **Consequências**: Prós, contras e impactos no projeto.

