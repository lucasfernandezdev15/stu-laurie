# Stu & Laurie Streaming — FE MVP

Cliente Expo / React Native TV (`react-native-tvos`) para **iOS, Android, Web, Apple TV y Android TV**.

## Estado

| Canal | Estado |
| --- | --- |
| iOS / Android / Web | Cerrado |
| Apple TV / Android TV | **Capa foco D-Pad lista** (requiere prebuild TV + emulator/device) |
| Backend / USIO / video CDN | Integración posterior |
| Subscribe web (Next → Woo) | Scaffold en `web-subscribe/` |

## Flujo

- Login / registro (sesión persistente)
- Home + Library + Account
- Detalle + gate premium + player
- Suscripción: link sutil en Home → página Next → checkout Woo (`?add-to-cart=1928`)
- **TV:** rail lateral + anillos de foco + remote play/pause/menu

## Deploy web (desktop) en Vercel

1. Subí el repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new) → Importá el repo.
3. **Root Directory:** dejar vacío (raíz del repo).
4. Vercel usa `vercel.json`: build `expo export -p web` → output `dist`.
5. Deploy → te da un link tipo `https://stu-laurie-streaming.vercel.app`.

Login demo: email válido + password ≥ 4 caracteres.

> La página de suscripción (`web-subscribe`) es **otro** proyecto en Vercel, con Root Directory = `web-subscribe`.

## Subscribe web (Vercel)

```bash
cd web-subscribe
npm install
npm run dev
```

En la app Expo, apuntá a esa URL:

```bash
# .env
EXPO_PUBLIC_SUBSCRIBE_WEB_URL=https://stu-suscription.vercel.app/subscribe
```

Detalle: [`web-subscribe/README.md`](./web-subscribe/README.md)

## Móvil / Web

```bash
npm install --legacy-peer-deps
npm run web
npm start
```

Demo: `fan@varietyhour.demo` / `demo`

### Preview del chrome TV en web

```bash
npm run web:tv
```

Fuerza `EXPO_PUBLIC_FORCE_TV=1` (rail + tamaños TV sin emulador).

## Build TV (Apple TV / Android TV)

Requiere [dev client / prebuild](https://docs.expo.dev/guides/building-for-tv/) — **no corre en Expo Go**.

```bash
# Generar nativos con flag TV
npm run prebuild:tv

# Android TV emulator
npm run run:android:tv

# Apple TV simulator (macOS + Xcode tvOS SDK)
npm run run:ios:tv
```

Volver a phone:

```bash
npm run prebuild
```

Perfiles EAS: `development_tv` / `preview_tv` en `eas.json`.

## Capas TV en código

```
src/tv/
  platform.ts      # isTV, tvScale
  TVFocusable.tsx  # Pressable + focus ring
  TVFocusGuide.tsx # TVFocusGuideView con fallback
src/navigation/TVTabBar.tsx  # rail D-Pad
```

## Documentación

- Guía FE (qué hay, cómo, preguntas): [`docs/GUIA-FE.md`](./docs/GUIA-FE.md)
- Plan DRM / Live / TV emulators / Woo+USIO / Apple IAP: [`docs/PLAN-DRM-LIVE-WOO-APPLE.md`](./docs/PLAN-DRM-LIVE-WOO-APPLE.md)
