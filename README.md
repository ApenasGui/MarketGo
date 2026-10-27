# MarketGo

Aplicativo mobile de compras com entrega, desenvolvido com Expo, React Native, TypeScript e Supabase. Implementa o fluxo do guia até a etapa 15: conta, catálogo, carrinho persistente, checkout, pedidos e acompanhamento.

**Projeto de estudo: pagamentos e entregas são simulados.**

## Demonstração

Capturas da interface em viewport mobile, geradas pelo teste de ponta a ponta com autenticação simulada e o SQL real em PGlite.

| Lojas                                            | Carrinho                                            | Checkout                                               | Acompanhamento                                                   |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| ![Catálogo de lojas](MarketGo/docs/screenshots/lojas.png) | ![Carrinho e totais](MarketGo/docs/screenshots/carrinho.png) | ![Endereço e pagamento](MarketGo/docs/screenshots/checkout.png) | ![Acompanhamento do pedido](MarketGo/docs/screenshots/acompanhamento.png) |

## Funcionalidades

- Cadastro, login, logout, rotas protegidas e sessão persistente.
- Busca sem acentos, filtro por categoria, lojas fechadas e catálogo por seção.
- Detalhe do produto, adição rápida e limite de 20 unidades por produto.
- Carrinho salvo por usuário, com confirmação para trocar de loja e pedido mínimo.
- Checkout com endereço, Pix, cartão na entrega ou dinheiro e validação de troco.
- Endereço anterior preenchido sem substituir campos já editados.
- Pedido criado por RPC, com preços e total calculados no banco.
- Histórico, atualização do acompanhamento a cada 5 segundos enquanto ativo, cancelamento e recompra com preços atuais.
- Confirmação antes de substituir o carrinho na recompra e aviso sobre produtos indisponíveis.
- Estados de carregamento, erro, vazio e tentativa de recuperação.

## Executar

Requer Node.js 22 ou superior. O projeto usa npm e mantém Expo SDK 58; o guia original usa SDK 57. As rotas estão em `src/app/`.

```bash
git clone https://github.com/ApenasGui/MarketGo.git
cd MarketGo/MarketGo
npm ci
```

Se ainda não existir, copie `.env.example` para `.env`. Preencha:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=SUA-CHAVE-PUBLICA
```

A URL deve ser a base do projeto, **sem `/rest/v1`**. Use a chave anon ou publishable, nunca service_role. Se mudar o `.env`, reinicie com `npx expo start -c`.

Em um projeto Supabase novo, execute no SQL Editor, nesta ordem:

1. [supabase/schema.sql](MarketGo/supabase/schema.sql)
2. [supabase/seed.sql](MarketGo/supabase/seed.sql)

São scripts iniciais, não migrações idempotentes: não reaplique em um banco existente sem revisar as tabelas. O catálogo inicial contém 6 lojas e 50 produtos. Se a confirmação de e-mail estiver habilitada no Supabase, confirme a conta antes de fazer login.

```bash
npx expo start
```

Use um ambiente compatível com o SDK instalado. O modo web pode ser iniciado com `npx expo start --web`.

## Segurança e arquitetura

O cliente **não escreve diretamente** em `orders` ou `order_items`. O RLS permite somente a leitura dos próprios pedidos; `create_order`, `advance_order` e `cancel_order` são as portas de escrita. Na criação, o app envia IDs e quantidades, endereço e pagamento; o servidor valida os produtos, calcula os valores e copia nomes e preços para preservar o histórico.

`advance_order` é uma simulação para estudo. Um produto real precisa separar as permissões da loja e do entregador e integrar o provedor de pagamento no servidor.

```text
src/app       telas e navegação (Expo Router)
src/components componentes reutilizáveis
src/context   sessão e carrinho por usuário
src/hooks     consultas e mutações (TanStack Query)
src/services  chamadas ao Supabase e RPCs
src/schemas   validações Zod
src/utils     regras puras de carrinho, catálogo, pedidos e dinheiro
supabase      SQL, dados iniciais e testes PGlite
__tests__     testes unitários e de contextos
e2e           fluxo de compra na interface com SQL real local
```

Dependência: **tela → hook → serviço → Supabase**. Os contextos coordenam sessão e estado local; as regras de dinheiro são reforçadas no servidor.

## Qualidade

| Comando                | Verificação                                 |
| ---------------------- | ------------------------------------------- |
| `npm run check`        | Lint, TypeScript, testes do app e banco     |
| `npm test`             | 56 testes Jest + 13 testes SQL              |
| `npm run test:app`     | Regras, autenticação, contextos e RPC       |
| `npm run test:db`      | RLS, permissões, totais, snapshots e status |
| `npm run test:e2e`     | Fluxo de compra no navegador e capturas     |
| `npm run format`       | Formatação do código                        |
| `npm run format:check` | Conferência da formatação                   |

Para instalar o navegador de teste:

```bash
npx playwright install chromium
npm run test:e2e
```

O teste de interface exporta o app web com configuração de teste, simula a autenticação e executa o **mesmo schema e seed** em PGlite. Verifica busca, categorias, loja fechada, carrinho persistente, troca de loja, checkout, troco, totais SQL, status, cancelamento, recompra, isolamento entre contas e recuperação de rede. Não acessa nem modifica o Supabase remoto e não altera o `.env`.

A verificação manual em Android/iOS e no banco remoto está documentada em [TESTES-MANUAIS](MarketGo/docs/TESTES-MANUAIS.md). Para conferir RLS e permissões do seu projeto Supabase, execute [verify.sql](MarketGo/supabase/verify.sql), que contém apenas consultas.

## Portfólio e apresentação

O [roteiro de apresentação](MarketGo/docs/APRESENTACAO.md) organiza uma demonstração de cinco minutos e explica as decisões de segurança. As capturas ficam em `docs/screenshots/` e podem ser atualizadas pelo teste de interface.

## APK de demonstração (opcional)

O perfil `preview` em [eas.json](MarketGo/eas.json) está preparado para distribuição interna Android em APK. Configure as duas variáveis públicas no ambiente do EAS, autentique sua conta e vincule o projeto quando solicitado:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

A geração de APK depende da sua conta EAS e das credenciais de assinatura; exportar os bundles com Expo não gera um instalador. A publicação nas lojas e pagamentos reais não fazem parte deste projeto de estudo.

## Autor

[ApenasGui](https://github.com/ApenasGui) · [Repositório](https://github.com/ApenasGui/MarketGo)
