# Corrigir "Usuários podem se conceder acesso premium"

## Auditoria do estado atual (verificado no banco)

| Item | Situação real |
|---|---|
| Policy de UPDATE em `profiles` | `Usuários podem atualizar seu próprio perfil`, para `authenticated`, com `USING (auth.uid() = id)` e **sem `WITH CHECK`** e **sem restrição de coluna** |
| Trigger de proteção | `tr_protect_profile_fields` existe e está **ativo**, `BEFORE UPDATE ... FOR EACH ROW` |
| Campos protegidos pelo trigger | `is_pro`, `credits`, `has_full_access` — revertidos para o valor antigo quando o papel não é `service_role` |
| Permissão de coluna | `authenticated` tem UPDATE em **todas** as colunas, incluindo as de cobrança |
| Funções privilegiadas | `grant_purchase`, `execute_essay_correction_flow`, `finalize_essay_correction`, `consume_essay_credit`, `refund_essay_credit`: execução liberada apenas para `postgres` e `service_role` — o app continua usando-as pelo backend |

### Conclusão da auditoria

O trigger **já bloqueia** na prática a escalada de privilégio, então hoje um usuário logado não consegue de fato virar premium pelo navegador. Porém:

1. O bloqueio é **silencioso**: o UPDATE "dá sucesso" e apenas descarta os campos. O usuário/frontend não recebe erro, o que dificulta detectar abuso e mantém o alerta do scanner válido (a policy realmente não restringe colunas).
2. A permissão de coluna continua concedida — se o trigger for removido ou desabilitado em qualquer migração futura, a brecha volta imediatamente. Hoje há **uma única camada** de defesa.
3. Encontrei código de teste ainda ativo em `src/routes/auth.tsx` (linha 46) que tenta `update({ is_pro: true, credits: 20 })` direto do navegador após login, disparado por uma flag no `localStorage`. Hoje ele é neutralizado pelo trigger, mas é exatamente o padrão que o alerta descreve e precisa sair.

## O que será feito

### 1. Defesa em profundidade no banco (migração)

- Revogar `UPDATE` de `authenticated` na tabela `profiles` e reconceder **apenas** nas colunas realmente editáveis pelo usuário: `full_name`, `avatar_url`, `updated_at`. Tentar escrever `credits`, `is_pro` ou `has_full_access` passa a falhar com erro de permissão, em vez de ser silenciosamente ignorado.
- Manter `service_role` com acesso total (webhook e fluxo seguro de correção continuam funcionando).
- Manter o trigger `tr_protect_profile_fields` como segunda camada, agora **falhando explicitamente** (erro claro em português) quando alguém que não é `service_role` tenta alterar campo de cobrança, em vez de reverter em silêncio. Alterações de campos normais seguem passando sem erro.
- Adicionar `WITH CHECK (auth.uid() = id)` à policy de UPDATE, para o usuário não poder reatribuir a linha a outro id.

### 2. Remover a escrita privilegiada do frontend

- Em `src/routes/auth.tsx`: remover o bloco de "mock purchase" que faz `update({ is_pro: true, credits: 20 })` e a flag `should_upgrade_after_auth`. A liberação de plano passa a existir apenas pelo webhook de pagamento.

### 3. Testes

Após a migração, verificar diretamente no banco, no papel `authenticated`:

- `is_pro = true` → deve falhar
- `has_full_access = true` → deve falhar
- aumentar `credits` → deve falhar
- alterar `full_name` do próprio perfil → deve funcionar
- alterar perfil de outro usuário → deve falhar
- `grant_purchase` pelo backend (liberação após pagamento) → deve funcionar
- consumo e estorno de crédito pelo fluxo seguro → deve funcionar
- criação de conta (`handle_new_user`) → deve funcionar

Depois rodo o Security Scanner novamente e informo se o alerta desapareceu.

## Detalhes técnicos

- `REVOKE UPDATE ON public.profiles FROM authenticated;` seguido de `GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;`
- `GRANT ALL ON public.profiles TO service_role;` mantido/reafirmado.
- `protect_profile_sensitive_fields()` reescrita: comparar `OLD`/`NEW` dos três campos e `RAISE EXCEPTION` quando `current_setting('role', true) <> 'service_role'`; continua `SECURITY DEFINER SET search_path = public`. As funções `SECURITY DEFINER` chamadas pelo backend rodam sob o papel `service_role`, portanto passam pelo trigger.
- `handle_new_user()` (INSERT) não é afetada: o trigger é só de UPDATE e a função roda como `postgres`.
- Nenhuma alteração em `essay_attempts`, na primeira correção gratuita ou nos links de checkout.
