import { supabase } from '@/lib/supabase';
import { createOrder } from '@/services/orders';
import type { CreateOrderInput } from '@/types';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
const input: CreateOrderInput = {
  storeId: 'store',
  items: [{ product_id: 'product', quantity: 2 }],
  payment: 'pix',
  changeFor: null,
  street: 'Rua das Flores',
  number: '120',
  neighborhood: 'Centro',
  complement: '',
};

test('cria pedidos exclusivamente por RPC sem enviar preços ou totais', async () => {
  jest.mocked(supabase.rpc).mockResolvedValue({ data: 'order-id', error: null } as never);
  await expect(createOrder(input)).resolves.toBe('order-id');
  expect(supabase.rpc).toHaveBeenCalledWith('create_order', {
    p_store_id: 'store',
    p_items: [{ product_id: 'product', quantity: 2 }],
    p_payment: 'pix',
    p_change_for: null,
    p_street: input.street,
    p_number: '120',
    p_neighborhood: 'Centro',
    p_complement: '',
  });
});

test('propaga ao checkout o erro de validação recebido do banco', async () => {
  const error = { message: 'O pedido mínimo desta loja é R$ 20,00.' };
  jest.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as never);
  await expect(createOrder(input)).rejects.toEqual(error);
});
