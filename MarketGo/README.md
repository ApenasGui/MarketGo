# MarketGo

Aplicativo de compras com entrega construído com Expo, React Native, TypeScript e Supabase. Implementação até a **etapa 10** do guia de construção.

## O que está pronto

- Configuração do Expo Router em `src/app`, TypeScript estrito, Jest e Prettier.
- Login e cadastro com React Hook Form e Zod, rotas protegidas e sessão persistente.
- Quatro abas: Lojas, Carrinho, Pedidos e Perfil; perfil com nome, e-mail e logout.
- Carrinho persistente por usuário, limite de 20 unidades e confirmação para trocar de loja.
- Serviços Supabase e hooks TanStack Query para catálogo, pedidos, endereço e recompra.
- Componentes reutilizáveis para formulários, lojas, produtos, quantidades e linha do tempo.
- Esquema SQL com catálogo, pedidos, RLS e funções `create_order`, `advance_order` e `cancel_order`.
- Dados de exemplo: 6 lojas e 50 produtos.
- 13 testes de banco com PGlite, sem Docker e sem acessar o Supabase remoto.
- Tipos do domínio, constantes do catálogo, tema, clientes Supabase e TanStack Query.
- Utilitários de erros em português, ícones, dinheiro e data.

O projeto mantém o Expo SDK 58 já instalado; o PDF usa SDK 57. As rotas ficam em `src/app/`, conforme as instruções deste repositório. As telas de Lojas, Carrinho, Pedidos, Loja, Produto, Checkout e Acompanhamento mostram “Em construção”, conforme a etapa 10. As interfaces completas dessas telas são implementadas nas etapas 11 a 13.

## Executar

Requer Node.js 22 ou superior (ambiente conferido com Node 24).

```bash
npm install
cp .env.example .env
```

Se `.env` já existir, preserve os seus valores. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` com a URL e a chave pública (anon ou publishable). Nunca use `service_role`.

Em um projeto Supabase novo, execute no SQL Editor, nesta ordem:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Os scripts são de configuração inicial, não migrações idempotentes. Se você já executou SQL no Supabase, confira as tabelas e funções existentes antes de rodá-los novamente. O banco remoto não foi modificado por esta implementação.

O catálogo deve ter 6 lojas e 50 produtos. Todas as quatro tabelas devem ter RLS ativo. Apenas as funções podem escrever pedidos; seus totais são calculados no servidor. `advance_order` serve para demonstração.

```bash
npx expo start
```

Abra pelo ambiente compatível com o SDK instalado. A conferência visual em um celular e a conferência do banco remoto devem ser feitas no seu ambiente.

## Verificações

```bash
npm run lint
npm run typecheck
npm run test:db
npm test
npm run format
```

Há 50 testes do aplicativo (os 37 do guia e 13 adicionais para autenticação, persistência, troca de conta, dados corrompidos e RPC) e 13 testes de banco. `test:app` executa o Jest; `test:db` executa os testes PGlite.

Para conferir a etapa 10: abra o aplicativo sem sessão, toque em Cadastre-se e teste uma senha de três caracteres. O campo deve mostrar “Use pelo menos 6 caracteres”. Com credenciais válidas, confira as quatro abas e o Perfil; feche e reabra para conferir a sessão persistente, depois saia da conta. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o e-mail antes de entrar.

## Estrutura

- `src/app`: rotas do Expo Router.
- `src/types`, `src/constants`, `src/theme`: base do domínio e visual.
- `src/lib`: conexão Supabase e cliente de cache.
- `src/context`: sessão e carrinho persistente por usuário.
- `src/services` e `src/hooks`: acesso ao banco e consultas/mutações.
- `src/schemas`: validações dos formulários com Zod.
- `src/components`: componentes compartilhados da interface.
- `__tests__`: testes de regras, serviços e contextos.
- `src/utils`: funções compartilhadas.
- `supabase`: esquema SQL, dados e testes locais.

A sessão usa AsyncStorage e renova o token com o aplicativo em primeiro plano. O cliente Supabase informa quando as variáveis de ambiente estão ausentes. O `.env` está ignorado pelo Git.
