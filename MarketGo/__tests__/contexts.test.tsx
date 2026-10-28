import { act } from 'react';
import { createRoot } from 'test-renderer';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { EMPTY_CART, replaceCart } from '@/utils/cart';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const auth = jest.mocked(supabase.auth);
const storage = jest.mocked(AsyncStorage);
const sessionFor = (id: string) =>
  ({ user: { id, email: `${id}@example.com` } }) as Session;
const store = { id: 'store', name: 'Mercado', delivery_fee: 5, min_order: 20 };
const product = { id: 'product', name: 'Arroz', emoji: '🍚', price: 30 };
const savedCart = replaceCart(store, product, 2);
let authValue: ReturnType<typeof useAuth>;
let cartValue: ReturnType<typeof useCart>;
let notify: Parameters<typeof supabase.auth.onAuthStateChange>[0];
let root: ReturnType<typeof createRoot>;
const unsubscribe = jest.fn();

function Probe() {
  authValue = useAuth();
  cartValue = useCart();
  return null;
}
async function mount() {
  root = createRoot();
  await act(async () => {
    root.render(
      <AuthProvider>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthProvider>,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  auth.getSession.mockResolvedValue({
    data: { session: sessionFor('alice') },
    error: null,
  });
  auth.onAuthStateChange.mockImplementation((callback) => {
    notify = callback;
    return { data: { subscription: { id: 'test', callback, unsubscribe } } };
  });
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue();
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  queryClient.clear();
});

test('restaura sessão e carrinho sem sobrescrever os dados antes da leitura', async () => {
  let finishRead!: (raw: string | null) => void;
  storage.getItem.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
  );
  await mount();
  expect(authValue.user?.id).toBe('alice');
  expect(cartValue.loading).toBe(true);
  expect(storage.setItem).not.toHaveBeenCalled();
  await act(async () => finishRead(JSON.stringify(savedCart)));
  expect(cartValue.loading).toBe(false);
  expect(cartValue.count).toBe(2);
  expect(storage.setItem).not.toHaveBeenCalled();
});

test('toques consecutivos acumulam quantidades e persistem o último carrinho', async () => {
  await mount();
  await act(async () => {
    cartValue.add(store, product);
    cartValue.add(store, product);
  });
  expect(cartValue.count).toBe(2);
  expect(storage.setItem).toHaveBeenLastCalledWith(
    'marketgo.cart.alice',
    JSON.stringify(savedCart),
  );
});

test('trocar de conta limpa o cache e nunca mostra o carrinho anterior', async () => {
  storage.getItem.mockImplementation(async (key) =>
    key.endsWith('alice') ? JSON.stringify(savedCart) : null,
  );
  await mount();
  queryClient.setQueryData(['orders', 'list'], ['pedido da Alice']);
  expect(cartValue.count).toBe(2);
  await act(async () => {
    await notify('SIGNED_IN', sessionFor('bob'));
  });
  expect(authValue.user?.id).toBe('bob');
  expect(cartValue.cart).toEqual(EMPTY_CART);
  expect(queryClient.getQueryData(['orders', 'list'])).toBeUndefined();
  expect(storage.getItem).toHaveBeenLastCalledWith('marketgo.cart.bob');
});

test('descarta JSON corrompido e libera o carrinho vazio', async () => {
  storage.getItem.mockResolvedValue('{inválido');
  await mount();
  expect(cartValue.loading).toBe(false);
  expect(cartValue.cart).toEqual(EMPTY_CART);
});

test('uma restauração antiga não desfaz um logout recebido durante a inicialização', async () => {
  let finishSession!: (
    value: Awaited<ReturnType<typeof supabase.auth.getSession>>,
  ) => void;
  auth.getSession.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishSession = resolve;
      }),
  );
  await mount();
  await act(async () => {
    await notify('SIGNED_OUT', null);
  });
  await act(async () =>
    finishSession({ data: { session: sessionFor('alice') }, error: null }),
  );
  expect(authValue.session).toBeNull();
  expect(authValue.loading).toBe(false);
});

test('falha ao restaurar sessão libera a tela de login', async () => {
  auth.getSession.mockRejectedValue(new Error('Sem rede'));
  await mount();
  expect(authValue.session).toBeNull();
  expect(authValue.loading).toBe(false);
});
