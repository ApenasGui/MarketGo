# Apresentação do MarketGo (5 minutos)

Todos os pagamentos e pedidos são de demonstração. Para usar a base do guia, o Supabase deve ter recebido `schema.sql` e `seed.sql`.

| Tempo     | Demonstração                                                       | Explicação                                                                                |
| --------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 0:00–1:00 | Entrar, buscar PAO e alternar uma categoria                        | Expo Router protege as rotas; busca ignora acentos e maiúsculas.                          |
| 1:00–2:00 | Adicionar dois produtos, abrir outra loja e cancelar a troca       | O carrinho pertence a uma loja e é persistido por usuário no aparelho.                    |
| 2:00–3:00 | Conferir o mínimo e a entrega; validar endereço e troco; confirmar | O app envia IDs e quantidades. Preços e total são calculados no banco.                    |
| 3:00–4:00 | Acompanhar, simular etapas e pedir novamente                       | A consulta atualiza a cada 5 segundos enquanto ativo; a recompra usa o catálogo atual.    |
| 4:00–5:00 | Abrir `schema.sql`, `verify.sql` e resultados dos testes           | RLS isola as contas e impede escrita direta. RPCs validam e gravam pedido e itens juntos. |

## Respostas para perguntas

- **Alterar o preço no celular funciona?** Não muda o preço cobrado no pedido: `create_order` consulta o preço no banco.
- **Por que copiar nome e preço nos itens?** Para preservar o histórico quando o catálogo mudar.
- **Quem muda os status?** Neste projeto de estudo, o usuário pode simular. Um produto real precisa de papéis da loja e do entregador.
- **Como o banco é testado?** PGlite executa o mesmo SQL localmente; os testes alternam usuários para verificar o RLS. O teste de interface usa autenticação simulada com esse mesmo banco SQL.
- **O pagamento é real?** Não. Cobranças reais exigem um provedor e confirmação no servidor por webhook.

## Antes da apresentação

Execute `npm run check`. Para reproduzir as capturas e o fluxo no navegador, execute `npm run test:e2e` após instalar o navegador de teste. No celular, siga `docs/TESTES-MANUAIS.md`. Confirme a conexão do aparelho com o Expo e o Supabase antes da aula.
