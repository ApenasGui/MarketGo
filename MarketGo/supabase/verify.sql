-- Conferência somente de leitura no SQL Editor do projeto Supabase.
select 'stores' as tabela, count(*) as quantidade from public.stores
union all select 'products', count(*) from public.products;

select c.relname as tabela, c.relrowsecurity as rls_ativo
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('stores', 'products', 'orders', 'order_items');

-- Pedidos e itens devem possuir somente políticas SELECT.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('orders', 'order_items');

-- As funções devem estar disponíveis para authenticated e indisponíveis para anon.
select p.proname as funcao, p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'execute') as anon_pode_executar,
  has_function_privilege('authenticated', p.oid, 'execute') as usuario_pode_executar
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('create_order', 'advance_order', 'cancel_order');
