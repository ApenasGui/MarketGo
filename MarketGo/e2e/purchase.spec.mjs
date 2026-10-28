import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createBackend } from './backend.mjs';

test('compra, persistência, segurança, cancelamento e recompra', async ({ page }) => {
  const backend = await createBackend();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let acceptDialogs = true;
  page.on('dialog', async (dialog) => {
    if (acceptDialogs) await dialog.accept();
    else await dialog.dismiss();
  });
  await page.route('https://marketgo-test.supabase.co/**', backend.handle);
  await mkdir('docs/screenshots', { recursive: true });
  const capture = (name) =>
    page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  const text = (value, options) =>
    page
      .getByText(value, options)
      .and(page.locator(':not([aria-hidden="true"], [aria-hidden="true"] *)'));
  const button = (name) => page.getByRole('button', { name, exact: true });
  const goHome = async () => {
    await page.goto('/');
    await expect(text('O que vai pedir hoje?')).toBeVisible();
  };
  try {
    await test.step('cadastro valida senha curta e autenticação abre as abas', async () => {
      await page.goto('/register');
      await page.getByLabel('Nome', { exact: true }).fill('Ana Silva');
      await page.getByLabel('E-mail', { exact: true }).fill('ana@example.com');
      await page.getByLabel('Senha', { exact: true }).fill('123');
      await page.getByLabel('Confirmar senha', { exact: true }).fill('123');
      await button('Criar conta').click();
      await expect(text('Use pelo menos 6 caracteres')).toBeVisible();
      await page.getByLabel('Senha', { exact: true }).fill('segredo123');
      await page.getByLabel('Confirmar senha', { exact: true }).fill('segredo123');
      await button('Criar conta').click();
      await expect(text('O que vai pedir hoje?')).toBeVisible();
      await capture('lojas');
    });
    await test.step('busca sem acentos e filtros por categoria', async () => {
      const search = page.getByRole('textbox', { name: 'Buscar loja ou tipo de comida' });
      await search.fill('PAO');
      await expect(text('Padaria Pão Quente', { exact: true })).toBeVisible();
      await expect(text('Mercado Bom Preço', { exact: true })).toHaveCount(0);
      await search.fill('');
      await button('🥖 Padaria').click();
      await expect(text('Mercado Bom Preço', { exact: true })).toHaveCount(0);
      await button('🥖 Padaria').click();
      await expect(text('Mercado Bom Preço', { exact: true })).toBeVisible();
    });
    await test.step('loja fechada não aceita produtos', async () => {
      await text('Sushi Sakura', { exact: true }).click();
      await expect(
        text('Fechada agora. Você pode ver o cardápio, mas não pedir.'),
      ).toBeVisible();
      await expect(button('Adicionar Combo 20 peças')).toBeDisabled();
      await goHome();
    });
    await test.step('adição rápida, quantidade no detalhe e persistência do carrinho', async () => {
      await text('Mercado Bom Preço', { exact: true }).click();
      await button('Adicionar Arroz branco 5 kg').click();
      await text('Leite integral 1 L', { exact: true }).click();
      await button('Aumentar quantidade').click();
      await page
        .getByRole('button', { name: 'Adicionar · R$ 10,50', exact: true })
        .click();
      await expect(text('Ver carrinho · 3 itens')).toBeVisible();
      await text('Ver carrinho · 3 itens').click();
      await expect(text('R$ 46,30', { exact: true })).toBeVisible();
      await page.reload();
      await expect(text('R$ 46,30', { exact: true })).toBeVisible();
      await capture('carrinho');
    });
    await test.step('troca de loja exige confirmação e cancelar preserva os itens', async () => {
      await goHome();
      await text('Padaria Pão Quente', { exact: true }).click();
      acceptDialogs = false;
      await button('Adicionar Pão francês (6 un)').click();
      await expect(text('Ver carrinho · 3 itens')).toBeVisible();
      acceptDialogs = true;
      await button('Adicionar Pão francês (6 un)').click();
      await expect(text('Ver carrinho · 1 item')).toBeVisible();
      await goHome();
      await text('Mercado Bom Preço', { exact: true }).click();
      await button('Adicionar Arroz branco 5 kg').click();
      await text('Leite integral 1 L', { exact: true }).click();
      await button('Aumentar quantidade').click();
      await button('Adicionar · R$ 10,50').click();
      await text('Ver carrinho · 3 itens').click();
    });
    await test.step('checkout valida endereço e troco e cria pedido no SQL', async () => {
      await button('Finalizar pedido').click();
      await button('Confirmar pedido · R$ 46,30').click();
      await expect(text('Informe a rua', { exact: true })).toBeVisible();
      await expect(text('Informe o número', { exact: true })).toBeVisible();
      await expect(text('Informe o bairro', { exact: true })).toBeVisible();
      await page.getByLabel('Rua', { exact: true }).fill('Rua das Flores');
      await page.getByLabel('Número', { exact: true }).fill('120');
      await page.getByLabel('Bairro', { exact: true }).fill('Centro');
      await page.getByRole('radio', { name: 'Dinheiro', exact: true }).click();
      await page.getByLabel('Troco para quanto? (opcional)', { exact: true }).fill('30');
      await button('Confirmar pedido · R$ 46,30').click();
      await expect(text('O troco deve cobrir o total do pedido')).toBeVisible();
      await page.getByLabel('Troco para quanto? (opcional)', { exact: true }).fill('50');
      await capture('checkout');
      await button('Confirmar pedido · R$ 46,30').click();
      await expect(text('Pedido recebido', { exact: true })).toBeVisible();
      await capture('acompanhamento');
      const { rows } = await backend.db.query('select total from orders');
      expect(rows).toHaveLength(1);
      expect(Number(rows[0].total)).toBe(46.3);
    });
    await test.step('pedido avança até entregue e usa preços atuais na recompra', async () => {
      for (let i = 0; i < 3; i++) {
        await button('Simular próximo passo').click();
        if (i < 2) await expect(button('Simular próximo passo')).toBeEnabled();
      }
      await expect(button('Pedir novamente')).toBeVisible();
      await expect(button('Cancelar pedido')).toHaveCount(0);
      await backend.db.query(
        "update products set price = 6 where name = 'Leite integral 1 L'",
      );
      await button('Pedir novamente').click();
      await expect(text('R$ 47,80', { exact: true }).last()).toBeVisible();
      await button('Finalizar pedido').click();
      await expect(page.getByLabel('Rua', { exact: true })).toHaveValue('Rua das Flores');
      await expect(page.getByLabel('Número', { exact: true })).toHaveValue('120');
      await button('Confirmar pedido · R$ 47,80').click();
      await expect(button('Cancelar pedido')).toBeVisible();
      await button('Cancelar pedido').click();
      await expect(text('Este pedido foi cancelado.')).toBeVisible();
    });
    await test.step('recompra ignora produto inativo, e mínimo bloqueia checkout', async () => {
      await backend.db.query(
        "update products set is_active = false where name = 'Arroz branco 5 kg'",
      );
      await button('Pedir novamente').click();
      await expect(
        text('Faltam R$ 8,00 para o pedido mínimo de R$ 20,00.'),
      ).toBeVisible();
      await expect(button('Finalizar pedido')).toBeDisabled();
      await button('Esvaziar carrinho').click();
      await expect(text('Seu carrinho está vazio')).toBeVisible();
    });
    await test.step('histórico mostra pedidos e outra conta não acessa os dados', async () => {
      await page.goto('/orders');
      await expect(text('Meus pedidos')).toBeVisible();
      await expect(text('Cancelado', { exact: true })).toBeVisible();
      await expect(text('Entregue', { exact: true })).toBeVisible();
      await page.goto('/profile');
      await expect(text('ana@example.com', { exact: true })).toBeVisible();
      await button('Sair da conta').click();
      await expect(button('Entrar')).toBeVisible();
      await page.getByLabel('E-mail', { exact: true }).fill('bruno@example.com');
      await page.getByLabel('Senha', { exact: true }).fill('segredo123');
      await button('Entrar').click();
      await expect(text('O que vai pedir hoje?')).toBeVisible();
      await page.goto('/orders');
      await expect(text('Nenhum pedido ainda')).toBeVisible();
      await page.goto('/cart');
      await expect(text('Seu carrinho está vazio')).toBeVisible();
    });
    await test.step('erro de rede mostra recuperação', async () => {
      backend.state.offline = true;
      await page.goto('/');
      await expect(text('Sem conexão com a internet.')).toBeVisible();
      backend.state.offline = false;
      await button('Tentar novamente').click();
      await expect(text('O que vai pedir hoje?')).toBeVisible();
    });
    expect(errors).toEqual([]);
  } finally {
    await backend.close();
  }
});
