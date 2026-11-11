> **Alunos: Alexsandro Alves de Albuquerque**
> **Alyson Josivaldo Marinho**
> **4º período. GTI**

# Documento de Requisitos de Software
## Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda


## 1. Objetivo do projeto

- Definir os requisitos para desenvolver um sistema integrado destinado a escritórios contábeis, contadores, profissionais fiscais e empresas. O sistema deverá centralizar cadastros, documentos, lançamentos contábeis, contas a pagar e receber, folha de pagamento, apuração tributária, obrigações acessórias, relatórios gerenciais e rotinas de Imposto de Renda, com trilha de auditoria e proteção de dados.

## 2. Escopo e limites

- Atender múltiplas empresas e clientes, com separação de dados por organização e permissões.
- Oferecer módulos contábil, fiscal, financeiro, folha/RH, patrimônio, obrigações acessórias, documentos e Imposto de Renda.
- Importar dados de planilhas e arquivos padronizados e permitir integração com sistemas externos por API e Webhooks quando disponível.
- Gerar relatórios, demonstrativos, alertas de prazos e exportações para conferência e transmissão.
- Não presumir que o sistema poderá transmitir declarações diretamente aos órgãos públicos: cada integração depende de disponibilidade, autorização, certificado e regras técnicas vigentes.
- Regras tributárias, tabelas, leiautes e prazos devem ser parametrizáveis e atualizados com base em fontes oficiais, com validação profissional antes do uso em produção.

## 3. Perfis de usuários e permissões

- **Administrador do sistema:** Configura organizações, usuários, segurança, integrações, planos e parâmetros globais.
- **Sócio/gestor do escritório:** Visualiza carteira de clientes, indicadores, produtividade, pendências e relatórios autorizados.
- **Contador responsável:** Aprova fechamentos, demonstrações, apurações e entregas sob sua responsabilidade.
- **Assistente contábil:** Executa lançamentos, conciliações e tarefas permitidas, sem aprovar ações restritas.
- **Fiscal/tributário:** Importa documentos fiscais, confere tributos e prepara obrigações fiscais.
- **Departamento pessoal/RH:** Mantém dados de empregados, folha, férias, afastamentos e eventos trabalhistas autorizados.
- **Financeiro do cliente:** Consulta e fornece documentos financeiros e acompanha contas e relatórios liberados.
- **Cliente contribuinte de IR:** Preenche questionários, envia documentos, acompanha pendências e revisa a declaração preparada.
- **Auditor/consulta:** Acessa somente dados autorizados, preferencialmente em modo leitura e com período limitado.

## 4. Requisitos funcionais


### 4.1 Cadastro de empresas e clientes

- **RF-001**: Cadastrar pessoa física e jurídica com nome/razão social, nome fantasia, CPF/CNPJ, inscrições, contatos, endereços e responsáveis.
- **RF-002**: Registrar regime tributário, atividade econômica, CNAE, natureza jurídica, município/UF, enquadramentos e datas de vigência.
- **RF-003**: Anexar contrato social, procurações, documentos cadastrais, certificados e outros arquivos, com controle de validade.
- **RF-004**: Manter histórico de alterações cadastrais, usuário responsável, data e justificativa.
- **RF-005**: Permitir múltiplos estabelecimentos, filiais, sócios e responsáveis técnicos vinculados à mesma organização.

### 4.2 Plano de contas e contabilidade

- **RF-006**: Manter plano de contas configurável por empresa, com códigos, níveis, natureza, classificação e contas sintéticas/analíticas.
- **RF-007**: Registrar lançamentos manuais e automáticos com data, competência, histórico, documento de origem, centro de custo e partidas de débito/crédito.
- **RF-008**: Validar partidas dobradas, período aberto, contas ativas e consistência dos valores antes de gravar.
- **RF-009**: Permitir modelos de lançamentos recorrentes, rateios, apropriações, provisões e estornos vinculados ao lançamento original.
- **RF-010**: Importar lançamentos por planilha/arquivo com pré-validação, relatório de erros e opção de desfazer lote.
- **RF-011**: Conciliar saldos contábeis com extratos bancários, contas a pagar/receber, folha e módulos fiscais.
- **RF-012**: Controlar períodos contábeis abertos, em fechamento e encerrados; reabertura exige permissão e justificativa.
- **RF-013**: Gerar balancete, razão, diário, balanço patrimonial, DRE, DFC quando aplicável, DMPL/DLPA quando aplicável e livro/relatórios auxiliares.
- **RF-014**: Permitir centros de custo, departamentos, projetos, unidades e comparativos por período.
- **RF-015**: Manter trilha de auditoria de inclusão, alteração, exclusão lógica, estorno e aprovação.

### 4.3 Fiscal e documentos tributários

- **RF-016**: Importar documentos fiscais eletrônicos e arquivos disponibilizados pelos sistemas autorizados, preservando o arquivo original e sua integridade.
- **RF-017**: Registrar notas de entrada e saída, serviços, retenções, cancelamentos, devoluções e ajustes aplicáveis.
- **RF-018**: Validar campos fiscais, datas, valores, participantes, códigos tributários e duplicidades conforme regras configuradas.
- **RF-019**: Classificar operações por natureza, CFOP/códigos aplicáveis, NCM, CST/CSOSN ou classificações vigentes, conforme operação e regime.
- **RF-020**: Calcular tributos com regras parametrizadas por regime, atividade, município/UF, período e tipo de operação.
- **RF-021**: Demonstrar memória de cálculo, base, alíquota, deduções, retenções, créditos e arredondamentos.
- **RF-022**: Controlar tributos retidos e sofridos, créditos, compensações, parcelamentos e vencimentos.
- **RF-023**: Preparar guias e demonstrativos para conferência, sem assumir transmissão automática quando não houver integração homologada.
- **RF-024**: Alertar sobre divergências entre documentos fiscais, apuração e contabilidade.

### 4.4 Regimes e apuração tributária

- **RF-025**: Suportar parametrização para Simples Nacional, Lucro Presumido, Lucro Real e outros enquadramentos aplicáveis, conforme escopo contratado.
- **RF-026**: Manter histórico de opção, anexos/faixas, atividades, segregação de receitas e parâmetros com vigência temporal.
- **RF-027**: Calcular tributos federais, estaduais e municipais conforme aplicabilidade e regras vigentes cadastradas.
- **RF-028**: Permitir simulações de cenários tributários, apresentando premissas, limitações e memória de cálculo.
- **RF-029**: Exigir conferência/aprovação de profissional autorizado antes de finalizar apuração ou obrigação.

### 4.5 Imposto de Renda Pessoa Física (IRPF)

- **RF-030**: Criar ficha do contribuinte com dados pessoais, dependentes, alimentandos, ocupação, endereço e dados bancários quando necessários.
- **RF-031**: Coletar rendimentos tributáveis, isentos/não tributáveis, sujeitos à tributação exclusiva, rendimentos recebidos acumuladamente e rendimentos do exterior, quando aplicável.
- **RF-032**: Registrar bens e direitos, dívidas e ônus, participações societárias, imóveis, veículos, aplicações, criptoativos e outros itens conforme regras do exercício.
- **RF-033**: Registrar pagamentos e despesas dedutíveis, contribuições, previdência, despesas médicas, educação, pensão e doações, conforme regras aplicáveis.
- **RF-034**: Controlar dependentes e evitar duplicidade de inclusão em declarações quando identificada.
- **RF-035**: Importar dados de informes e documentos por arquivos compatíveis ou digitação assistida; registrar origem e exercício.
- **RF-036**: Conferir consistência entre rendimentos, imposto retido, bens, dívidas, evolução patrimonial e informações de dependentes.
- **RF-037**: Comparar opções de tributação permitidas para o exercício, quando aplicável, exibindo estimativas e premissas.
- **RF-038**: Gerar lista de documentos faltantes, pendências, alertas e resumo para revisão do contribuinte.
- **RF-039**: Armazenar declaração, recibo, cópia transmitida e comprovantes fornecidos pelo cliente com acesso restrito.
- **RF-040**: Acompanhar status de preparação, revisão, autorização, transmissão realizada externamente ou por integração autorizada, retificação e pendências.
- **RF-041**: Não inventar campos, deduções, limites ou regras; atualizar o sistema por exercício fiscal e validar com orientações oficiais vigentes.

### 4.6 Imposto de Renda Pessoa Jurídica e obrigações correlatas

- **RF-042**: Organizar informações contábeis e fiscais necessárias à preparação de obrigações de IRPJ/CSLL, conforme regime e escopo.
- **RF-043**: Controlar adições, exclusões, compensações, prejuízos fiscais e bases de cálculo quando aplicáveis.
- **RF-044**: Manter memória de apuração, conciliação com a contabilidade e documentação de suporte.
- **RF-045**: Preparar dados para obrigações digitais aplicáveis, respeitando leiautes e versões oficiais vigentes.

### 4.7 Financeiro: contas a pagar e receber

- **RF-046**: Cadastrar títulos, parcelas, fornecedores, clientes, vencimentos, condições de pagamento e categorias.
- **RF-047**: Controlar pagamentos, recebimentos, baixas parciais, juros, multas, descontos, estornos e inadimplência.
- **RF-048**: Importar extratos e sugerir conciliações bancárias; permitir confirmação manual.
- **RF-049**: Gerar fluxo de caixa, posição financeira, aging de recebíveis, previsão de pagamentos e relatórios por centro de custo.
- **RF-050**: Registrar anexos e vínculo entre título, documento fiscal, lançamento contábil e comprovante.

### 4.8 Folha de pagamento e departamento pessoal

- **RF-051**: Cadastrar empregados e contratos, cargos, salários, jornadas, dependentes e dados obrigatórios com acesso restrito.
- **RF-052**: Preparar cálculos de folha, férias, 13º, rescisões, adicionais, descontos e encargos conforme parâmetros legais vigentes.
- **RF-053**: Registrar eventos variáveis, ponto importado, afastamentos, licenças, benefícios e alterações contratuais.
- **RF-054**: Preparar eventos e informações para sistemas oficiais de folha/trabalho quando aplicável, conforme leiaute vigente.
- **RF-055**: Gerar recibos, relatórios de folha, provisões, encargos e lançamentos contábeis integrados.
- **RF-056**: Manter trilha de aprovação e restringir dados salariais e de saúde a usuários autorizados.

### 4.9 Ativo imobilizado e estoque (quando contratado)

- **RF-057**: Cadastrar bens, localização, responsável, data de aquisição, custo, vida útil e valor residual.
- **RF-058**: Calcular e registrar depreciação/amortização/exaustão conforme política contábil e fiscal configurada.
- **RF-059**: Controlar baixas, transferências, reavaliações permitidas e histórico documental.
- **RF-060**: Importar saldos e movimentações de estoque ou integrar com sistema de gestão, quando houver.

### 4.10 Obrigações acessórias, prazos e tarefas

- **RF-061**: Manter calendário fiscal/trabalhista parametrizado por cliente, regime, município/UF e período.
- **RF-062**: Criar tarefas com responsável, prazo, prioridade, status, checklist e anexos.
- **RF-063**: Enviar alertas de vencimento e atraso por notificações configuradas, com registro de entrega quando disponível.
- **RF-064**: Controlar versões de leiautes, recibos, protocolos, comprovantes e retificações.
- **RF-065**: Exibir painel de obrigações pendentes, em preparação, em revisão, entregues e atrasadas.

### 4.11 Documentos e atendimento ao cliente

- **RF-066**: Disponibilizar portal para cliente enviar e consultar documentos e acompanhar solicitações.
- **RF-067**: Organizar documentos por cliente, exercício, competência, tipo e processo, com busca e filtros.
- **RF-068**: Permitir checklist de documentos, comentários, pedidos de correção e confirmação de recebimento.
- **RF-069**: Controlar acesso, download, compartilhamento, prazo de retenção e descarte conforme política aprovada.
- **RF-070**: Registrar consentimentos, autorizações e procurações quando necessários, sem substituir análise jurídica.

### 4.12 Relatórios, indicadores e exportação

- **RF-071**: Gerar relatórios em PDF, XLSX e CSV, com filtros por cliente, período, conta, centro de custo e status.
- **RF-072**: Disponibilizar painéis de tarefas, faturamento do escritório, inadimplência, obrigações, fechamentos e produtividade.
- **RF-073**: Permitir exportação controlada e registrar usuário, data, filtros e finalidade quando necessário.
- **RF-074**: Oferecer relatórios de auditoria, alterações, acessos, falhas de integração e aprovações.

### 4.13 Administração e integrações

- **RF-075**: Administrar usuários, perfis, permissões, autenticação multifator e sessões ativas.
- **RF-076**: Configurar integrações por credenciais protegidas, tokens com escopo mínimo e rotação/revogação.
- **RF-077**: Disponibilizar API documentada para integrações autorizadas, com autenticação, limites de uso e logs.
- **RF-078**: Importar/exportar dados com validação, pré-visualização, relatório de erros e prevenção de duplicidade.
- **RF-079**: Manter ambiente de testes separado do ambiente de produção.
- **RF-080**: Permitir parametrização por exercício fiscal e atualização controlada de tabelas, fórmulas e leiautes.

## 5. Requisitos não funcionais

- **RNF-001**: Segurança Criptografar tráfego com TLS e dados sensíveis armazenados; proteger segredos; aplicar menor privilégio e segregação entre clientes.
- **RNF-002**: LGPD e privacidade: Definir finalidade, base legal, minimização, direitos dos titulares, contratos com operadores, retenção e descarte; registrar incidentes e atender solicitações conforme procedimento aprovado.
- **RNF-003**: Autenticação Permitir política de senhas fortes, MFA para perfis privilegiados, bloqueio/limitação de tentativas e encerramento de sessões.
- **RNF-004**: Auditoria Registrar ações relevantes com usuário, horário, objeto, operação e resultado; logs protegidos contra alteração indevida.
- **RNF-005**: Disponibilidade Definir meta de disponibilidade com o contratante; monitorar serviço, filas, integrações e falhas.
- **RNF-006**: Desempenho Meta inicial sugerida: 95% das telas comuns em até 3 segundos sob carga acordada; cálculos e relatórios maiores devem informar progresso. Validar por testes.
- **RNF-007**: Escalabilidade Suportar crescimento de clientes, documentos, lançamentos e usuários sem degradação inaceitável.
- **RNF-008**: Backup e recuperação Executar backups automáticos, criptografados e testados; definir RPO/RTO com o negócio e testar restauração periodicamente.
- **RNF-009**: Usabilidade e acessibilidade Interface responsiva em computador, tablet e celular, linguagem clara, navegação consistente e acessibilidade compatível com boas práticas.
- **RNF-010**: Compatibilidade Suportar navegadores modernos e exportações em formatos abertos; documentar requisitos de integração.
- **RNF-011**: Manutenibilidade Código versionado, revisões, documentação, testes automatizados, migrações controladas e ambientes separados.
- **RNF-012**: Confiabilidade dos cálculos: Usar regras versionadas, testes com casos de referência, arredondamento documentado e memória de cálculo reproduzível.
- **RNF-013**: Integridade Usar transações, chaves e validações para impedir duplicidade, perda de dados e lançamentos inconsistentes.
- **RNF-014**: Observabilidade Disponibilizar métricas, logs, alertas e rastreamento de erros sem expor dados pessoais nos registros.
- **RNF-015**: Portabilidade e saída de dados: Permitir exportação dos dados do cliente em formato utilizável, conforme permissões e contrato, sem aprisionamento indevido.
- **RNF-016**: Continuidade Documentar plano de resposta a incidentes, recuperação de desastre e comunicação com clientes.

## 6. Regras de negócio essenciais

- **RB-001**: Todo lançamento contábil deve estar balanceado; débitos e créditos devem ser iguais.
- **RB-002**: Períodos encerrados não podem ser alterados sem permissão especial, justificativa e registro de auditoria.
- **RB-003**: Nenhuma declaração ou apuração será marcada como aprovada sem revisão e aprovação de usuário autorizado.
- **RB-004**: Cálculos fiscais e de IR devem usar regras específicas do exercício, regime, jurisdição e situação do contribuinte.
- **RB-005**: O sistema deve distinguir dados informados pelo cliente, dados importados, cálculos do sistema e dados revisados pelo profissional.
- **RB-006**: Arquivos importados devem ser validados e deduplicados, preservando o original e o resultado do processamento.
- **RB-007**: Correções devem ser rastreáveis; quando aplicável, preferir estorno ou retificação em vez de apagar registros históricos.
- **RB-008**: Acesso a dados de um cliente não pode permitir visualizar dados de outro cliente sem autorização expressa.
- **RB-009**: Alertas de prazo são auxiliares; o responsável continua obrigado a confirmar o prazo oficial aplicável.
- **RB-010**: O sistema não deve prometer conformidade automática: tabelas, fórmulas, integrações e obrigações precisam de manutenção e validação profissional.

## 7. Modelo de dados mínimo

- Organização/Escritório; Empresa/Estabelecimento; Pessoa/Cliente; Usuário; Perfil; Permissão; Procuração/Autorização.
- Plano de contas; Centro de custo; Período contábil; Lançamento; Partida; Documento de origem; Conciliação.
- Documento fiscal; Item fiscal; Regra tributária; Apuração; Guia; Obrigação; Protocolo; Calendário e tarefa.
- Contribuinte IR; Dependente; Rendimentos; Pagamentos; Bens e direitos; Dívidas; Documento comprobatório; Declaração e recibo.
- Título financeiro; Parcela; Pagamento/Recebimento; Conta bancária; Extrato; Fornecedor; Cliente financeiro.
- Empregado; Contrato; Evento de folha; Folha; Férias; Rescisão; Encargos; Recibo.
- Bem patrimonial; Depreciação; Estoque (se aplicável); Arquivo; Comentário; Notificação; Log de auditoria; Registro de consentimento.

## 8. Integrações previstas

- Receita Federal e serviços de declaração/consulta autorizados, conforme APIs, programas e permissões oficialmente disponíveis.
- Sistemas estaduais e municipais de documentos fiscais, serviços e obrigações, de acordo com cada localidade.
- Bancos e instituições financeiras para extratos e conciliação, preferencialmente por conexão autorizada ou importação de arquivos.
- Sistemas de folha, eSocial e demais ambientes oficiais aplicáveis, conforme regras e leiautes vigentes.
- Assinatura eletrônica, armazenamento documental, e-mail e mensageria para notificações, se contratados.
- Cada integração deve definir responsável, finalidade, campos, autenticação, limites, tratamento de erros, retentativas e plano alternativo.

## 9. Critérios de aceitação

- Um usuário só acessa empresas e módulos para os quais recebeu permissão; testes devem comprovar isolamento entre clientes.
- Um lançamento balanceado é aceito e um lançamento desbalanceado é bloqueado com mensagem clara.
- Importação de arquivo apresenta resumo de registros aceitos, rejeitados e duplicados, com motivo por linha.
- Relatórios contábeis conferem com os lançamentos aprovados e exibem período, filtros e data de geração.
- Apuração fiscal/IR apresenta memória de cálculo, versão das regras utilizadas e pendências encontradas.
- Período encerrado não aceita alteração comum; reabertura fica registrada e restrita.
- Backup pode ser restaurado em ambiente de teste conforme o RPO/RTO acordado.
- Testes de segurança verificam autenticação, autorização, criptografia, sessão, logs e vulnerabilidades comuns.
- Exportações preservam integridade dos dados e são acessíveis somente a usuários autorizados.
- Antes da produção, profissionais contábeis validam cenários de referência e regras legais para cada módulo habilitado.

## 10. Testes necessários

- Testes unitários de fórmulas, validações, arredondamentos e regras tributárias.
- Testes de integração para importações, exportações, APIs, autenticação e falhas de comunicação.
- Testes funcionais de ponta a ponta para cadastro, lançamento, fechamento, apuração, revisão e relatórios.
- Testes de permissão e isolamento de dados entre clientes e perfis.
- Testes de carga, desempenho, recuperação de backup, restauração e continuidade.
- Testes de segurança, análise de vulnerabilidades e revisão de logs.
- Testes de aceitação com contadores e usuários reais usando dados fictícios ou anonimizados.

## 11. Fases sugeridas de desenvolvimento

- **Fase 1 — Descoberta:** Entrevistas, processos atuais, perfis, escopo, legislação aplicável, riscos e prioridades.
- **Fase 2 — Projeto:** Arquitetura, protótipos, modelo de dados, matriz de permissões, integrações e plano de segurança.
- **Fase 3 — MVP:** Cadastros, usuários, documentos, plano de contas, lançamentos, relatórios básicos e auditoria.
- **Fase 4 — Fiscal e financeiro:** Importações fiscais, apuração parametrizada, contas a pagar/receber e conciliação.
- **Fase 5 — Imposto de Renda:** Fluxo de documentos, fichas, validações, pendências, comparação de cenários e revisão.
- **Fase 6 — Folha e obrigações:** Folha, tarefas, calendários e integrações selecionadas.
- **Fase 7 — Homologação:** Testes, migração piloto, validação contábil/fiscal, treinamento e correções.
- **Fase 8 — Produção e manutenção:** Implantação gradual, monitoramento, suporte, atualização de regras e revisão periódica.

## 12. Riscos e medidas preventivas

- **Alteração frequente da legislação:** manter regras por vigência, calendário de atualização e aprovação profissional.
- **Erro de cálculo ou classificação:** testes de referência, memória de cálculo, revisão e trilha de auditoria.
- **Vazamento de dados:** MFA, criptografia, permissões mínimas, monitoramento, treinamento e plano de incidentes.
- **Falha de integração pública:** não depender de uma única integração; manter importação/exportação alternativa e logs.
- **Documentação incompleta do cliente:** checklist, alertas, status de pendência e registro das solicitações.
- **Escopo excessivo:** entregar por fases, priorizar MVP e aprovar mudanças formalmente.
- **Perda de dados:** backups testados, restauração documentada e metas RPO/RTO definidas.

## 13. Questões que devem ser definidas antes da contratação

- O sistema será usado por um único escritório ou será uma plataforma para vários escritórios/clientes?
- Será web, aplicativo móvel, instalado localmente ou híbrido?
- Quais módulos entram na primeira versão e quais ficam para fases posteriores?
- Quais regimes tributários, estados e municípios precisam ser atendidos inicialmente?
- O sistema apenas preparará declarações ou haverá integração oficial de transmissão quando permitida?
- Quantos clientes, usuários, documentos e lançamentos são esperados por mês?
- Qual orçamento, prazo, equipe, infraestrutura e nível de suporte serão adotados?
- Quais dados serão migrados de sistemas antigos e quem validará os saldos?
- Quais metas de disponibilidade, desempenho, retenção, RPO e RTO serão contratadas?
- Quem será o responsável técnico por validar regras contábeis, fiscais, trabalhistas e de Imposto de Renda?
