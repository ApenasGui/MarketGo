import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Cart, Product, Store } from '@/types';
import {
  EMPTY_CART,
  addToCart,
  cartTotals,
  isValidCart,
  itemCount,
  removeItem,
  replaceCart,
  setQuantity,
} from '@/utils/cart';
import { useAuth } from './AuthContext';
type CartStore = Pick<Store, 'id' | 'name' | 'delivery_fee' | 'min_order'>;
type CartProduct = Pick<Product, 'id' | 'name' | 'emoji' | 'price'>;
interface CartContextValue {
  cart: Cart;
  loading: boolean;
  count: number;
  totals: ReturnType<typeof cartTotals>;
  add: (
    store: CartStore,
    product: CartProduct,
    quantity?: number,
  ) => 'added' | 'conflict';

  replaceWith: (store: CartStore, product: CartProduct, quantity?: number) => void;
  setCart: (cart: Cart) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}
const CartContext = createContext<CartContextValue | undefined>(undefined);
// A chave remonta o estado antes de exibir o carrinho de outra conta.
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `marketgo.cart.${user.id}` : null;
  return (
    <UserCartProvider key={storageKey ?? 'guest'} storageKey={storageKey}>
      {children}
    </UserCartProvider>
  );
}

function UserCartProvider({
  children,
  storageKey,
}: {
  children: ReactNode;
  storageKey: string | null;
}) {
  const [cart, setCartState] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(Boolean(storageKey));
  const currentCart = useRef(EMPTY_CART);
  const ready = useRef(!storageKey);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (!cancelled && isValidCart(parsed)) {
          currentCart.current = parsed;
          setCartState(parsed);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          ready.current = true;
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const updateCart = useCallback(
    (update: Cart | ((previous: Cart) => Cart)) => {
      if (!storageKey || !ready.current) {
        throw new Error('Aguarde o carregamento do carrinho da sua conta.');
      }
      const next = typeof update === 'function' ? update(currentCart.current) : update;
      currentCart.current = next;
      setCartState(next);
      // Grava na ordem dos toques, mesmo quando o armazenamento está lento.
      writes.current = writes.current
        .then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next)))
        .catch(() => undefined);
    },
    [storageKey],
  );
  const add = useCallback(
    (store: CartStore, product: CartProduct, quantity = 1) => {
      const result = addToCart(currentCart.current, store, product, quantity);
      if (result.conflict) return 'conflict' as const;
      updateCart(result.cart);
      return 'added' as const;
    },
    [updateCart],
  );
  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      count: itemCount(cart),
      totals: cartTotals(cart),
      add,
      replaceWith: (store, product, quantity = 1) =>
        updateCart(replaceCart(store, product, quantity)),
      setCart: (next) => {
        if (!isValidCart(next)) throw new Error('Carrinho inválido.');
        updateCart(next);
      },
      changeQuantity: (productId, quantity) =>
        updateCart((c) => setQuantity(c, productId, quantity)),
      remove: (productId) => updateCart((c) => removeItem(c, productId)),
      clear: () => updateCart(EMPTY_CART),
    }),
    [cart, loading, add, updateCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de <CartProvider>');
  return context;
}
