# 13 — Jornada do Usuário pelo Celular (Do Primeiro Acesso ao Fechamento da Folha)

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Foco:** Experiência simples, intuitiva e guiada para uma pessoa comum utilizando um smartphone (`320px` a `430px`).

---

## 1. Princípios de Orientação Permanente na Tela Mobile

Em qualquer ponto da aplicação no celular, o usuário visualiza imediatamente as 6 respostas essenciais da Seção 3.3:
1. **Onde está:** Título claro da tela ativa + item destacado na Barra Inferior (*Bottom Navigation*) + passo ativo no *Stepper* da jornada.
2. **O que precisa fazer:** Subtítulo em linguagem simples (sem jargões como `RF-051`) e botão de ação principal destacado.
3. **O que já concluiu:** Indicadores com `✓` no *Stepper* da competência (ex: `✓ Equipe (3)` → `✓ Eventos (2)` → `● Calcular & Conferir`).
4. **O que falta:** Contador de funcionários pendentes de conferência antes do fechamento (ex: `"2 de 3 funcionários conferidos"`).
5. **Se existe algum problema:** Banner de alerta claro no topo dos cartões (ex: `"⚠️ Colaborador com falta lançada"` ou `"🔒 Competência fechada para edições"`).
6. **Como prosseguir:** Botão de próximo passo ao final de cada etapa (ex: após lançar eventos, botão `"Ir para Cálculo da Folha →"`).

---

## 2. Passo a Passo da Jornada Integrada de 18 Passos pelo Smartphone (Seção 14)

Abaixo está o roteiro completo da jornada que o usuário realiza integralmente pelo celular e que servirá como **Teste Integrado Ponta a Ponta (`ME-14`)**:

### Passo 1 — Abrir a Aplicação no Smartphone
- O usuário acessa a URL pelo navegador do celular (Chrome Android ou Safari iOS).
- O layout carrega instantaneamente ajustado à largura da tela, exibindo a Barra de Competência no topo (`2026-11 · Rascunho`), o Guia de Passos da Folha e a Barra de Navegação Inferior com 5 botões grandes.

### Passo 2 — Realizar Identificação / Autenticação de Sessão
- No topo da tela, o usuário toca no botão de **Operador / Perfil**, informa seu nome (ex: `"Maria Clara - Gestora RH"`) e confirma o perfil **🛡️ RH / Admin (Acesso Total)**.
- O sistema exibe feedback imediato e passa a registrar todas as ações da sessão em nome da usuária.

### Passo 3 — Conferir / Cadastrar os Dados da Empresa Empregadora
- Ainda na tela inicial (**Início**), a usuária vê o **Cartão da Empresa Empregadora**.
- Toca em **"✏️ Editar Empresa"**, atualiza ou confere a Razão Social, CNPJ fictício e endereço, e toca em **"Salvar Empresa"**. Os dados são gravados no Neon (`pagamentus.companies`).

### Passo 4 e Passo 5 — Cadastrar Três Funcionários Fictícios e Registrar Salários
- Na barra inferior, a usuária toca em **"👥 Equipe"** e depois em **"➕ Novo Funcionário"**.
- O formulário abre como um *bottom sheet* confortável no celular:
  - Digita o Nome, o CPF fictício (com teclado numérico e máscara automática `000.000.000-00`), o Cargo e o Departamento;
  - Informa o **Salário Base** (com teclado decimal), seleciona a Jornada (`40h` ou `44h semanais`), a Data de Admissão e o número de Dependentes;
  - Toca em **"Salvar Funcionário"**.
- O funcionário aparece imediatamente como um **Cartão Mobile** na lista, mostrando Nome, Cargo, Status `Ativo` e Salário Base em destaque, além do botão para vincular **Benefícios** (ex: Vale-Refeição).

### Passo 6 — Selecionar a Competência
- Na **Barra Global de Competência** no topo, a usuária seleciona ou confirma a competência desejada (ex: `2026-12` ou `2026-11`).
- Toda a aplicação sincroniza automaticamente para aquela competência.

### Passo 7 — Lançar Eventos Variáveis (Incluindo um Lançamento com Erro Proposital)
- Na barra inferior, a usuária toca em **"⏱️ Eventos"** e depois em **"➕ Novo Evento"**.
- Seleciona o Funcionário 1, escolhe **Horas Extras**, digita `10` horas a `50%` (um valor propositalmente maior do que o correto, que seriam `4` horas) e vê na hora a **Prévia Automática em R$** antes de tocar em **"Lançar Evento"**.
- Lança também um Adicional ou Falta para outro funcionário. Os eventos aparecem em cartões claros na tela.

### Passo 8 — Calcular a Folha pelo Celular
- A usuária toca no botão **"Ir para Folha →"** (ou no ícone **"🧮 Folha"** na barra inferior).
- Toca no botão principal **"⚡ Calcular & Gravar Folha"**.
- O botão mostra `"Calculando..."` (evitando duplo clique), processa no backend e grava o cálculo transacionalmente no Neon.

### Passo 9 e Passo 10 — Conferir Resultados no Celular e Identificar o Erro Proposital
- Na tela da Folha, a usuária vê os totalizadores no topo e, logo abaixo, os **Cartões de Conferência por Funcionário**.
- Sem precisar dar zoom nem arrastar tabela para o lado, ela vê em cada cartão: **Proventos Brutos**, **Total de Descontos** e **Salário Líquido**.
- Ao tocar em **"▼ Ver Memória de Cálculo"** no cartão do Funcionário 1, ela vê a linha `"Horas Extras 50% (10h)"` e percebe que lançou `10h` em vez de `4h`.

### Passo 11 e Passo 12 — Corrigir o Lançamento pelo Celular e Recalcular
- No próprio cartão do Funcionário 1 (ou tocando em **"✏️ Ajustar Eventos"**), a usuária edita o evento de `10h` para `4h` (ou exclui e corrige) com apenas 2 toques.
- Toca novamente em **"⚡ Recalcular Folha"**.
- Os valores de Proventos, INSS, IRRF, FGTS e Salário Líquido são atualizados instantaneamente na tela e no Neon.
- A usuária toca em **"✓ Marcar Conferido"** nos cartões dos funcionários.

### Passo 13 — Confirmar o Fechamento da Competência pelo Celular
- Com os valores conferidos, a usuária toca em **"🔒 Fechar Competência"**.
- Abre-se o **Modal de Confirmação de Fechamento**, exibindo o resumo financeiro completo (Total Bruto, Descontos, **Total Líquido a Pagar**, Encargos e quantidade de funcionários) e explicando que a competência ficará protegida contra alterações acidentais.
- Ela confirma a observação de fechamento e toca em **"Confirmar Fechamento da Folha"**.
- O badge da competência muda para **`🔒 FECHADA`**, e os botões de edição/exclusão de eventos daquela competência ficam bloqueados.

### Passo 14 — Abrir e Consultar os Demonstrativos (Holerites) no Celular
- A usuária toca em **"📄 Ver Holerite"** no cartão do funcionário (ou na aba **"📄 Recibos"** na barra inferior).
- Visualiza o holerite completo com a Razão Social e CNPJ da empresa, proventos, descontos (INSS, IRRF, benefícios), bases de FGTS e **Valor Líquido a Receber**.
- Usa os botões **"◀ Anterior"** e **"Próximo ▶"** para folhear os recibos dos três funcionários com o polegar e pode acionar **"🖨️ Imprimir / Salvar PDF"** ou **"📤 Compartilhar Resumo"**.

### Passos 15, 16, 17 e 18 — Encerrar Sessão, Acessar Novamente e Comprovar Persistência no Neon
- A usuária toca em **"Sair / Encerrar Sessão"** (ou fecha o navegador e abre uma nova aba/sessão limpa).
- Acessa novamente a aplicação pelo celular e vai até **"📄 Recibos"** / **"📝 Histórico & Auditoria"**.
- Na lista de **Competências Fechadas**, vê a competência que acabou de fechar com status **`FECHADA`** e o exato valor líquido total.
- Toca em **"Consultar Folha"**, abre os holerites e verifica que todos os funcionários, eventos, cálculos, fechamento e logs de auditoria permanecem 100% persistidos no **Neon PostgreSQL**.
