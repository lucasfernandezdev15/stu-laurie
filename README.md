# Stu & Laurie Streaming — FE MVP

Cliente Expo / React Native TV (`react-native-tvos`) para **iOS, Android, Web, Apple TV y Android TV**.

## Estado

| Canal | Estado |
| --- | --- |
| iOS / Android / Web | Cerrado |
| Apple TV / Android TV | **Capa foco D-Pad lista** (requiere prebuild TV + emulator/device) |
| Backend / USIO / video CDN | Auth + catálogo + playback cableados a API |
| Subscribe web (Next → Woo) | Register/login real → checkout Woo |

## Flujo

- Login / registro vía `POST /api/auth/*` (tokens + `GET /api/auth/me`)
- Home + Library desde `GET /api/videos` + `GET /api/live-events`
- Player: `GET .../playback` (URL firmada)
- Suscripción: web Next → register API → checkout Woo (`?add-to-cart=1928`)
- **TV:** rail lateral + anillos de foco + remote play/pause/menu

## Config API

```bash
# .env (raíz Expo)
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SUBSCRIBE_WEB_URL=https://stu-suscription.vercel.app/subscribe
```

```bash
# web-subscribe/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WOO_CHECKOUT_URL=https://thestuandlaurievarietyhour.com/checkout/?add-to-cart=1928
```

## Deploy web (desktop) en Vercel

1. Subí el repo a GitHub.
2. En [vercel.com/new](https://vercel.com/new) → Importá el repo.
3. **Root Directory:** dejar vacío (raíz del repo).
4. Vercel usa `vercel.json`: build `expo export -p web` → output `dist`.
5. Setear `EXPO_PUBLIC_API_URL` en Vercel (staging/prod).
6. Deploy → te da un link tipo `https://stu-laurie-streaming.vercel.app`.

> La página de suscripción (`web-subscribe`) es **otro** proyecto en Vercel, con Root Directory = `web-subscribe` y `NEXT_PUBLIC_API_URL`.

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

Login con una cuenta real del backend (ya no hay demo local).

### Preview del chrome TV en web

```bash
npm run web:tv
```

Fuerza `EXPO_PUBLIC_FORCE_TV=1` (rail + tamaños TV sin emulador).

## APK local (Android + Android TV)

Los binarios salen en `dist/`. Requiere `.env` (copiá `.env.example`), JDK 17 y Android SDK.

```bash
npm run apk:phone     # dist/stu-laurie-streaming-release.apk
npm run apk:tv        # dist/stu-laurie-streaming-androidtv-release.apk
```

Corré `apk:phone:clean` / `apk:tv:clean` **solo** cuando cambia la config nativa:
`app.json`, config plugins, dependencias nativas o upgrade de Expo.

### Tiempos medidos (8 núcleos / 14 GB)

| Escenario | Tiempo |
| --- | --- |
| Primera vez de cada target (o `:clean`) | ~27 min |
| Cambios de JS/TS, mismo target | **~40 s – 4 min** |
| Switch phone ↔ TV con ambos cacheados | **~4–5 min** |

El switch no es instantáneo: hay que mover ~1 GB de nativos (en Windows
`rename` suele fallar con `EPERM`, así que usa `robocopy /MOVE`) y Gradle
reconfigura el proyecto. Sigue siendo ~5× más rápido que un clean.

### Por qué

`expo prebuild` **siempre** borra `android/` — como la carpeta está en
`.gitignore`, Expo la trata como descartable, con o sin `--clean`. Eso tira ~27 min
de compilación C++/Kotlin. La única salida barata es no correr prebuild.

El script guarda una carpeta nativa por target en `.native-cache/` (~1 GB cada una)
y las intercambia al cambiar de target, así Gradle solo rehace el bundle JS y el
empaquetado. El target activo queda anotado en `android/.build-target`.

Cortar de 4 a 2 ABIs **no** bajó el tiempo del clean build: Gradle compila las
arquitecturas en paralelo y sobran núcleos. Sí bajó el APK de 83 MB a 47 MB.
Si necesitás emuladores x86: `npm run apk:phone:all-abis`.

Otros ajustes: daemon de Gradle + `--build-cache`, lint de release excluido
(`--lint` para reactivarlo), y `org.gradle.caching` / heap de 4 GB / Kotlin
incremental en `~/.gradle/gradle.properties` — va ahí porque el
`gradle.properties` del proyecto lo regenera cada prebuild.

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

## Build en la nube (EAS)

Compila en servidores de Expo — **única vía para iOS / tvOS desde Windows**.

```bash
npx eas-cli login

npm run cloud:android      # APK Android
npm run cloud:androidtv    # APK Android TV
npm run cloud:ios          # iOS (requiere Apple Developer, USD 99/año)
npm run cloud:appletv      # tvOS
```

Perfiles en `eas.json`: `preview*` para pruebas internas, `production*` para store
(`.aab`). Todos heredan de `base`, que inyecta `EXPO_PUBLIC_API_URL` y
`EXPO_PUBLIC_SUBSCRIBE_WEB_URL` — sin eso el build sale sin backend.

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
