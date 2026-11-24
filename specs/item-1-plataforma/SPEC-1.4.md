# SPEC-1.4 – Autenticação, senhas e MFA

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 1 – Plataforma | @joaovitor-webdev | A definir | https://trello.com/c/mraVbqk1 | Revisando |

## 1. Contexto e objetivo
Atender ao RF-075 e ao RNF-003 com autenticação por senha, MFA para perfis privilegiados, limitação de tentativas, administração autorizada de usuários/perfis/permissões e encerramento de sessões.

## 2. Requisitos relacionados
- **RF-075**: Administrar usuários, perfis, permissões, autenticação multifator e sessões ativas.
- **RNF-003 — Autenticação**: Permitir política de senhas fortes, MFA para perfis privilegiados, bloqueio/limitação de tentativas e encerramento de sessões.

## 3. Escopo
- **Dentro do escopo:**
  - Recusar senhas que não cumpram a política aplicada no cadastro e na alteração.
  - Exigir verificação MFA antes de liberar recursos protegidos para perfis privilegiados.
  - Contabilizar tentativas de autenticação malsucedidas e bloquear novas tentativas ao atingir o limite.
  - Permitir que o usuário consulte e encerre suas sessões; permitir gestão administrativa conforme permissões.
  - Permitir administrar usuários, perfis e permissões com autorização baseada no perfil.
- **Fora do escopo:**
  - Integração com provedores externos de identidade social (OAuth/OpenID Connect externos).
  - Trilha de auditoria detalhada de operações de domínio (pertencente à SPEC-1.5).
  - Regras de negócio contábeis, fiscais, financeiras ou de folha de pagamento.
  - Valores normativos de comprimento/complexidade da senha, limite de tentativas e duração do bloqueio, não definidos no RF-075/RNF-003.

## 4. Cenários
- **Senha:** cadastro ou alteração com senha fora da política é recusado; senha válida é armazenada como hash.
- **MFA:** perfil privilegiado autentica a senha, mas não acessa recursos protegidos até validar o código MFA.
- **Tentativas:** falhas consecutivas incrementam o contador; atingido o limite configurado, novas tentativas são bloqueadas até o fim do período de bloqueio.
- **Sessões:** o próprio usuário ou um administrador autorizado consulta sessões ativas e encerra uma ou todas; tokens encerrados não autorizam requisições.
- **Administração:** operações de gestão só são permitidas a usuários autenticados com a permissão necessária.

## 5. Critérios de aceite
- **CA-1:** Dado o cadastro ou alteração de senha de um usuário, quando for informada uma senha fraca que não atenda à política de senhas fortes, então o sistema deve recusar a operação e impedir o salvamento da senha.
- **CA-2:** Dado um usuário vinculado a perfil privilegiado, quando autenticar suas credenciais primárias, então o sistema deve exigir código MFA válido antes de autorizar qualquer recurso protegido.
- **CA-3:** Dado o processo de autenticação, quando o número de tentativas consecutivas com falha atingir o limite máximo permitido, então o sistema deve bloquear novas tentativas de login para aquela conta/origem.
- **CA-4:** Dada uma sessão ativa, quando o titular ou um administrador autorizado encerrar a sessão ou todas as sessões do usuário, então requisições subsequentes com os tokens encerrados devem ser recusadas.
- **CA-5:** Dado um usuário autenticado, quando consultar ou alterar usuários, perfis, permissões ou sessões administrativas, então o sistema deve permitir somente as operações autorizadas pelas permissões do perfil.

## 6. Plano técnico
- Manter os modelos e o repositório de autenticação usados pela aplicação; senhas ficam armazenadas como hash com salt.
- Gerar e validar códigos TOTP temporais para segundo fator, com sessão pendente até concluir MFA.
- Aplicar o limite e o período de bloqueio já configurados no serviço.
- Proteger rotas administrativas com middleware de sessão e autorização por chave de permissão; respostas não devem expor hash de senha, segredo MFA ou token de sessão de terceiros.
- O segredo MFA gerado automaticamente é retornado somente na resposta inicial de cadastro para provisionamento; endpoints de consulta não o expõem.
- **Pendência de produto:** o código usa como padrões técnicos senha de no mínimo 8 caracteres (maiúscula, minúscula, número e símbolo), 5 tentativas e bloqueio de 15 minutos. Confirmar esses valores antes de tratá-los como requisitos normativos.

## 7. Tarefas de implementação
- [x] Revalidar e completar o fluxo de senha forte, MFA e bloqueio conforme os critérios.
- [x] Disponibilizar operações de administração e consulta de permissões de forma protegida.
- [x] Implementar consulta e encerramento individual ou em lote de sessões, sem expor tokens em listagens.
- [x] Cobrir os critérios CA-1 a CA-5 com testes automatizados.
- [x] Executar build e testes e registrar resultados e pendências de ambiente.
- [x] Atualizar a entrada da SPEC-1.4 no `CHANGELOG.md` e anexar evidências do PR.

## 8. Dependências
- `SPEC-1.1` (Repositório, documentação e padrões de contribuição).
- `SPEC-1.2` (Arquitetura, stack e ambientes).
- `SPEC-1.3` (Modelo de dados e integridade).

## 9. Como validar
1. Execute `npm run build`.
2. Execute `npx jest --runInBand tests/autenticacaoMfaSessoes.test.ts`.
3. Confirme que senha fraca não é persistida e que alteração de senha respeita a mesma política (CA-1).
4. Confirme que perfil privilegiado não acessa rota protegida sem TOTP válido (CA-2).
5. Repita falhas até o limite configurado e verifique bloqueio, inclusive para senha correta durante o bloqueio (CA-3).
6. Consulte sessões e encerre uma e todas; confirme que tokens revogados recebem 401 e listagens não revelam tokens (CA-4).
7. Repita consultas/alterações administrativas com e sem as permissões correspondentes (CA-5).

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/56.
- CA-1 a CA-5: `npx jest --runInBand tests/autenticacaoMfaSessoes.test.ts` passou com 7 testes; cobre recusa de senha fraca, vetor TOTP RFC 6238, bloqueio, encerramento/revogação, autorização administrativa e isolamento entre organizações.
- `npm run build`: passou.
- `npm test`: 33 de 37 suítes e 143 de 157 testes passaram. As 4 suítes de integração restantes requerem `DATABASE_URL_TEST`, ausente neste ambiente.

## 11. Histórico de revisão
- Reimplementação SDD: critérios alinhados a RF-075 e RNF-003; a definição normativa da política de senha e dos valores de bloqueio permanece pendente de validação pelo produto.
