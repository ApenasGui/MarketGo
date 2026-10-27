# Conferência no celular e no Supabase

Estes cenários são o roteiro da etapa 14. As caixas abaixo ficam desmarcadas até a conferência real no dispositivo. Os testes automatizados usam PGlite e autenticação simulada; não comprovam a configuração de um projeto remoto.

- [ ] 1. Cadastro com senha de 3 caracteres mostra “Use pelo menos 6 caracteres”.
- [ ] 2. Cadastro válido abre as abas; fechar e reabrir preserva a sessão. Se o Supabase exigir confirmação, confirme o e-mail antes de entrar.
- [ ] 3. Buscar `padaria` e `PAO` encontra Padaria Pão Quente.
- [ ] 4. Tocar na categoria filtra; tocar novamente limpa.
- [ ] 5. Sushi Sakura informa loja fechada e não permite adicionar itens.
- [ ] 6. Adicionar pelo “+” e pelo detalhe atualiza quantidade, selo e barra do carrinho.
- [ ] 7. Fechar e reabrir mantém o carrinho da mesma conta.
- [ ] 8. Trocar de loja pede confirmação; cancelar preserva os itens e confirmar substitui.
- [ ] 9. Abaixo do mínimo, o carrinho mostra quanto falta e desabilita Finalizar pedido.
- [ ] 10. No checkout com itens, confirmar sem endereço mostra erros sob rua, número e bairro.
- [ ] 11. Dinheiro com troco abaixo do total mostra erro; Pix e Cartão ignoram o troco.
- [ ] 12. Confirmar um pedido válido abre o acompanhamento e esvazia o carrinho.
- [ ] 13. Conferir `orders.total` e os snapshots de `order_items` no Supabase; devem usar os preços do servidor.
- [ ] 14. Simular avança recebido → preparo → entrega → entregue; ao terminar, aparece Pedir novamente.
- [ ] 15. Cancelar funciona somente enquanto recebido; depois do preparo o botão não aparece.
- [ ] 16. Novo checkout usa o endereço anterior sem substituir campos já editados.
- [ ] 17. Sair e entrar em outra conta não revela pedidos ou carrinho da conta anterior.
- [ ] 18. Sem conexão, uma consulta nova mostra erro e Tentar novamente recupera após reconectar. Dados em cache podem continuar visíveis.

## Segurança no banco remoto

Execute `supabase/verify.sql` no SQL Editor. Confira RLS nas quatro tabelas, somente políticas SELECT em pedidos/itens e RPCs liberadas para `authenticated`, sem execução por `anon`. Não execute novamente os scripts iniciais num banco já configurado sem revisar as tabelas existentes.

## Capturas e teste automatizado

As capturas em `docs/screenshots` são geradas pelo fluxo automatizado em viewport mobile, com a mesma interface e SQL do projeto e autenticação simulada. Não representam compras reais nem dados de usuários do Supabase.
