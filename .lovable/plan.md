# Diagnóstico: "Signed-In Users Can Execute SECURITY DEFINER Function"

Nenhuma alteração foi feita. Abaixo o diagnóstico completo, confirmado com consulta direta às permissões do banco e ao código do app.

## Quais funções disparam o alerta

Existem 6 funções no schema público. Apenas duas são `SECURITY DEFINER` **e** executáveis por usuários logados (role `authenticated`) — são essas duas que geram o alerta:

| Função | SECURITY DEFINER | Quem pode executar hoje |
|---|---|---|
| `consume_essay_credit()` | sim | postgres, service_role, **authenticated** |
| `refund_essay_credit()` | sim | postgres, service_role, **authenticated** |
| `grant_purchase(...)` (2 versões) | sim | postgres, service_role (authenticated **não** tem acesso) |
| `handle_new_user()` | sim | postgres, service_role (trigger) |
| `protect_profile_sensitive_fields()` | não (INVOKER) | trigger |

## O que cada uma faz e onde é usada

**`consume_essay_credit()`** — verifica o plano do usuário logado (`auth.uid()`) e desconta 1 crédito antes da correção. Retorna se está liberado, se é acesso vitalício e o saldo restante. Chamada no frontend em `src/components/EssaySubmissionArea.tsx` (linha 96), antes de acionar a IA.

**`refund_essay_credit()`** — devolve 1 crédito ao usuário logado caso a IA falhe. Chamada no frontend em `src/components/EssaySubmissionArea.tsx` (linha 201), dentro do `catch` de erro.

Ambas estão diretamente ligadas a **créditos, planos e monetização** (leem/escrevem `profiles.is_pro`, `credits`, `has_full_access`). Elas precisam ser `SECURITY DEFINER` porque a tabela `profiles` tem um trigger que bloqueia o usuário de alterar esses campos por conta própria — só a função privilegiada consegue mexer no saldo.

`grant_purchase` (liberação de plano após pagamento) já está corretamente fechada: só o webhook, via chave de serviço, consegue chamá-la. Isso não é problema.

## Usuários logados precisam chamar essas funções direto?

Hoje sim — o fluxo de correção é iniciado no navegador e chama as duas por RPC. Se o `EXECUTE` de `authenticated` fosse simplesmente revogado sem mais nada, o app quebraria: nenhuma correção de usuário pago seria autorizada (erro "Não foi possível verificar seus créditos") e o estorno em caso de falha da IA pararia de funcionar.

## Existe risco real de manipulação pelo frontend?

- `consume_essay_credit()` — **risco baixo**. Ela só desconta crédito, sempre para o próprio `auth.uid()`. Chamar de forma abusiva só prejudica o próprio usuário.
- `refund_essay_credit()` — **risco real e concreto**. Ela **adiciona** 1 crédito ao próprio usuário e não valida se houve realmente uma falha de correção. Qualquer usuário logado com plano Essencial pode abrir o console do navegador e chamar `supabase.rpc('refund_essay_credit')` em loop para gerar créditos infinitos de graça. Isso é perda direta de receita, não apenas um aviso de linter.

Ou seja: o alerta do scanner é genérico, mas ao investigar encontramos um problema de negócio de verdade em `refund_essay_credit`.

## Recomendação (para decidir depois — nada será feito agora)

A correção adequada é mover o crédito/estorno para o servidor: as duas chamadas passariam a acontecer dentro do server function que já executa a correção (`correct-essay`), e o `EXECUTE` de `authenticated` seria revogado. Assim o estorno só pode ocorrer quando a IA realmente falhou, o linter para de alertar, e o frontend deixa de ter poder sobre o saldo.

Alternativa mais barata (só fecha a brecha grave): manter `consume_essay_credit` acessível e proteger apenas `refund_essay_credit`, exigindo prova de uma tentativa de correção falhada.

## Detalhes técnicos

- Permissões verificadas em `pg_proc.proacl`: `authenticated=X` presente somente em `consume_essay_credit` e `refund_essay_credit`.
- Nenhuma dessas funções é chamada por trigger; ambas dependem de `auth.uid()`, portanto exigem contexto de sessão do usuário.
- `refund_essay_credit` já filtra por `is_pro = true AND has_full_access = false`, então o abuso se limita a usuários do plano Essencial — mas nesse grupo é ilimitado.
