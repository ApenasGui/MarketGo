import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const ALICE = '11111111-1111-1111-1111-111111111111';
const BOB = '22222222-2222-2222-2222-222222222222';
const moneyFields = new Set([
  'price',
  'rating',
  'delivery_fee',
  'min_order',
  'subtotal',
  'total',
  'change_for',
  'unit_price',
  'total_price',
]);
function jsonRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value instanceof Date
        ? value.toISOString()
        : moneyFields.has(key) && value !== null
          ? Number(value)
          : value,
    ]),
  );
}
const userFor = (id) => ({
  id,
  aud: 'authenticated',
  role: 'authenticated',
  email: id === BOB ? 'bruno@example.com' : 'ana@example.com',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: id === BOB ? 'Bruno Silva' : 'Ana Silva' },
});
function sessionFor(id) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp, role: 'authenticated' })}.c2ln`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: `refresh-${id}`,
    user: userFor(id),
  };
}
function requestUser(request) {
  try {
    return JSON.parse(
      Buffer.from(request.headers().authorization.split('.')[1], 'base64url'),
    ).sub;
  } catch {
    return ALICE;
  }
}

// O navegador usa autenticação simulada; todos os dados e RPCs passam pelo SQL real.
export async function createBackend() {
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create role anon nologin; create role authenticated nologin;
    grant usage on schema public, auth to anon, authenticated;
    insert into auth.users values ('${ALICE}'), ('${BOB}');
  `);
  await db.exec(
    await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
  );
  await db.exec(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  let queue = Promise.resolve();
  function asUser(id, callback) {
    const task = queue.then(async () => {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec('set role authenticated');
      try {
        return await callback();
      } finally {
        await db.exec('reset role');
      }
    });
    queue = task.catch(() => undefined);
    return task;
  }
  const state = { offline: false, addressDelay: 0 };
  async function handle(route) {
    const request = route.request();
    const url = new URL(request.url());
    if (state.offline) return route.abort('failed');
    const fulfill = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    if (url.pathname.startsWith('/auth/v1/')) {
      if (url.pathname.endsWith('/user')) return fulfill(userFor(requestUser(request)));
      if (url.pathname.endsWith('/logout')) return fulfill({});
      const body = request.postDataJSON() ?? {};
      return fulfill(sessionFor(body.email?.startsWith('bruno') ? BOB : ALICE));
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const name = url.pathname.split('/').at(-1);
      const input = request.postDataJSON();
      try {
        const result = await asUser(requestUser(request), async () => {
          if (name === 'create_order') {
            const { rows } = await db.query(
              'select public.create_order($1, $2::jsonb, $3, $4, $5, $6, $7, $8) as id',
              [
                input.p_store_id,
                JSON.stringify(input.p_items),
                input.p_payment,
                input.p_change_for,
                input.p_street,
                input.p_number,
                input.p_neighborhood,
                input.p_complement,
              ],
            );
            return rows[0].id;
          }
          if (!['advance_order', 'cancel_order'].includes(name))
            throw new Error('RPC desconhecida');
          const { rows } = await db.query(`select public.${name}($1) as result`, [
            input.p_order_id,
          ]);
          return rows[0].result;
        });
        return fulfill(result);
      } catch (error) {
        return fulfill({ message: error.message, code: error.code }, 400);
      }
    }
    const table = url.pathname.split('/').at(-1);
    if (!['stores', 'products', 'orders'].includes(table))
      return fulfill({ message: 'Recurso desconhecido' }, 404);
    try {
      if (
        table === 'orders' &&
        url.searchParams.get('select')?.startsWith('address_') &&
        state.addressDelay
      ) {
        await new Promise((resolve) => setTimeout(resolve, state.addressDelay));
      }
      let rows = await asUser(requestUser(request), async () => {
        const params = [];
        const filters = [];
        for (const column of ['id', 'store_id']) {
          const filter = url.searchParams.get(column);
          if (filter?.startsWith('eq.')) {
            params.push(filter.slice(3));
            filters.push(`${column} = $${params.length}`);
          }
        }
        const order = (url.searchParams.get('order') ?? '')
          .split(',')
          .filter(Boolean)
          .map((part) => {
            const [column, direction] = part.split('.');
            if (!['name', 'section', 'created_at'].includes(column))
              throw new Error('Ordenação inválida');
            return `${column} ${direction === 'desc' ? 'desc' : 'asc'}`;
          });
        const limit = url.searchParams.has('limit')
          ? ` limit ${Math.max(0, Math.min(100, Number(url.searchParams.get('limit')) || 0))}`
          : '';
        const result = await db.query(
          `select * from ${table}${filters.length ? ` where ${filters.join(' and ')}` : ''}${order.length ? ` order by ${order.join(', ')}` : ''}${limit}`,
          params,
        );
        const list = result.rows.map(jsonRow);
        if (url.searchParams.get('select')?.includes('items:')) {
          for (const row of list)
            row.items = (
              await db.query('select * from order_items where order_id = $1', [row.id])
            ).rows.map(jsonRow);
        }
        return list;
      });
      if (request.headers().accept?.includes('vnd.pgrst.object')) {
        if (rows.length !== 1)
          return fulfill({ message: 'Registro não encontrado', code: 'PGRST116' }, 406);
        rows = rows[0];
      }
      return fulfill(rows);
    } catch (error) {
      return fulfill({ message: error.message }, 400);
    }
  }
  return {
    handle,
    state,
    db: {
      query: (...args) => {
        const task = queue.then(() => db.query(...args));
        queue = task.catch(() => undefined);
        return task;
      },
    },
    close: async () => {
      await queue;
      await db.close();
    },
  };
}
