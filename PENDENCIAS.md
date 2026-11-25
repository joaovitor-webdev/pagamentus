# Pendências da Fase 2 (Concluídas na Fase 8)

## Implementado na Fase 2
- **Empresas (criação):** formulário funcional em `ModuloCadastros.tsx` com validação de CPF/CNPJ (dígito verificador) e gravação no Supabase.
- **Empregados (criação e listagem):** formulário em `ModuloFolha.tsx` com nome, CPF, PIS, cargo, CBO, salário base, admissão, contrato, VT e status.
- **Lançamentos Contábeis:** formulário e diário em `ModuloContabil.tsx` gravando no Supabase apenas em contas analíticas.
- **Financeiro e Fiscal:** leitura e escrita em `titulos_financeiros`, `clientes_fornecedores` e `apuracoes_fiscais` com RLS e triggers de auditoria.
- **Bucket privado `documentos`:** criado no Supabase Storage (migration `0003`) com políticas RLS por empresa e papel.

## Concluído na Fase 8
- [x] **Plano de contas hierárquico (sintética x analítica) + importação CSV:** árvore do plano de contas e importador CSV em `ModuloContabil.tsx`.
- [x] **Upload real de documentos na UI:** formulário de upload para o bucket `documentos`, campo de data de validade e alerta de vencimento em `ModuloCadastros.tsx`.
- [x] **Editar e inativar empresa na UI:** ações de edição e inativação lógica (sem excluir) em `ModuloCadastros.tsx`.
- [x] **Tela de Clientes/Fornecedores:** interface CRUD dedicada para `clientes_fornecedores` em `ModuloCadastros.tsx`.
- [x] **Máscaras de entrada:** máscaras automáticas de CPF, CNPJ, CEP e telefone nos campos de formulário.
- [x] **Holerite em PDF + histórico por empregado:** layout dedicado de impressão/PDF por empregado e consulta histórica por competência em `ModuloFolha.tsx`.
