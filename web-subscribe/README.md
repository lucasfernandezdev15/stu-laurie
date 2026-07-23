# Stu & Laurie — web subscribe bridge

Mini app **Next.js** para Vercel: registro local → redirect al checkout WooCommerce/USIO.

## Flujo

1. Usuario abre `/subscribe` (desde la app o el browser).
2. Completa nombre, email y password (MVP: se guarda en `localStorage` + `ref` UUID).
3. Redirect a  
   `https://thestuandlaurievarietyhour.com/checkout/?add-to-cart=1928&ref=…&sl_email=…`
4. Paga en WordPress (tarjeta USIO).

> WordPress aún **no** lee `ref`. Falta el snippet/plugin mínimo (guardar meta + webhook) para activar la app.

## Local

```bash
cd web-subscribe
npm install
npm run dev
```

Abrí [http://localhost:3000/subscribe](http://localhost:3000/subscribe).

## Vercel

1. Importá la carpeta `web-subscribe` (o el monorepo con Root Directory = `web-subscribe`).
2. Seteá `NEXT_PUBLIC_WOO_CHECKOUT_URL` si hace falta.
3. En la app Expo: `EXPO_PUBLIC_SUBSCRIBE_WEB_URL=https://TU-PROYECTO.vercel.app/subscribe`

## Env

Ver `.env.example`.
