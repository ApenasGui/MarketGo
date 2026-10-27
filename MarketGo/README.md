# MarketGo

Aplicativo de compras com entrega construído com Expo, React Native, TypeScript e Supabase. Implementação até a **etapa 5** do guia de construção.

## O que está pronto

- Configuração do Expo Router em `src/app`, TypeScript estrito, Jest e Prettier.
- Tela temporária “MarketGo funcionando!”.
- Esquema SQL com catálogo, pedidos, RLS e funções `create_order`, `advance_order` e `cancel_order`.
- Dados de exemplo: 6 lojas e 50 produtos.
- 13 testes de banco com PGlite, sem Docker e sem acessar o Supabase remoto.
- Tipos do domínio, constantes do catálogo, tema, clientes Supabase e TanStack Query.
- Utilitários de erros em português, ícones, dinheiro e data.

O projeto mantém o Expo SDK 58 já instalado; o PDF usa SDK 57. As rotas ficam em `src/app/`, conforme as instruções deste repositório. Login, catálogo interativo, carrinho e checkout pertencem às próximas etapas.

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

Até a etapa 5, há 13 testes de banco. Os testes de regras do aplicativo serão criados na etapa 6; `test:app` aceita a ausência desses testes nesta fase.

## Estrutura

- `src/app`: rotas do Expo Router.
- `src/types`, `src/constants`, `src/theme`: base do domínio e visual.
- `src/lib`: conexão Supabase e cliente de cache.
- `src/utils`: funções compartilhadas.
- `supabase`: esquema SQL, dados e testes locais.

A sessão usa AsyncStorage e renova o token com o aplicativo em primeiro plano. O cliente Supabase informa quando as variáveis de ambiente estão ausentes. O `.env` está ignorado pelo Git.
