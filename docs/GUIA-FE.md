# Stu & Laurie Streaming — Guía FE (para humanos)

Documento de referencia del **frontend**: qué se pidió, qué hay, qué falta, cómo hacerlo y **qué preguntar** antes de seguir.

> Alcance de este doc: **solo FE**. Backend, pagos USIO/Stripe, budget de infra y CDN los resuelve otro equipo; acá solo aparece lo que el FE necesita saber de ellos para integrar.

**Proyecto:** `stu-laurie-streaming`  
**Stack:** Expo + React Native (`react-native-tvos`)  
**Cliente (contexto):** The Stu & Laurie Variety Hour — plataforma de suscripción multiplataforma.

---

## 1. La idea en una frase

Una app donde la gente **se loguea, ve el catálogo, reproduce video y gestiona la suscripción**.  
La **plata se cobra en la web** (para no pagarle comisión a las stores). Las apps son sobre todo **acceso + reproducción**.

---

## 2. Qué pidió el cliente (plataformas)

| Plataforma   | ¿Pedida? | Estado FE hoy                          |
| ------------ | -------- | -------------------------------------- |
| iOS          | Sí       | Lista (MVP)                            |
| Android      | Sí       | Lista (MVP)                            |
| Web          | Sí       | Lista (MVP)                            |
| Apple TV     | Sí       | Capa de foco lista; falta build/QA real |
| Android TV   | Sí       | Capa de foco lista; falta build/QA real |
| Roku         | No       | Fuera de fase                          |
| Samsung/LG   | No       | Fuera de fase                          |

**Importante:** el cliente pidió **las TVs**, no pidió por nombre `react-native-tvos` ni “foco D-Pad”. Eso es **cómo** se construye una app de TV usable con el control remoto.

---

## 3. Qué hay hoy (MVP FE)

### Funciona

- Login / registro (mock, sesión guardada en el dispositivo)
- Home con hero + filas de catálogo
- Library
- Detalle de episodio
- Player (video de muestra)
- Suscripción mock (simula billing web)
- Contenido premium bloqueado si no hay suscripción
- Capa TV: rail lateral, anillos de foco, preferencia de foco, remote en player

### Cómo probarlo

```bash
cd stu-laurie-streaming
npm install --legacy-peer-deps

npm run web          # móvil/web normal
npm run web:tv       # preview del “modo TV” en el browser
npm start            # Expo Go (iOS/Android phone)
```

**Demo:** `fan@varietyhour.demo` / `demo`

### Build TV real (no es Expo Go)

```bash
npm run prebuild:tv
npm run run:android:tv    # emulador Android TV
npm run run:ios:tv        # Apple TV (hace falta Mac + Xcode tvOS)
```

---

## 4. Qué NO es de este FE (otro equipo / más adelante)

- Backend (NestJS, auth real, APIs)
- USIO / Stripe / cobro real
- Bunny / Mux / Cloudflare / IVS (video real)
- Panel admin web
- Budget de infraestructura
- Roku / Samsung / LG

Cuando eso exista, el FE **integra** (cambia mocks por APIs). No hace falta reinventar pantallas.

---

## 5. Tres riesgos grandes del FE (leer sí o sí)

Hay tres temas que pueden hacer que el producto “funcione en la notebook” y **falle en el mundo real**. Hay que decidirlos temprano.

### 5.1 DRM (FairPlay + Widevine)

**Para tontos:** sin DRM, alguien puede grabar/bajar el stream y subirlo a otro lado. Con DRM, el video viaja “cerrado” y solo se abre en el player autorizado.

**Por qué duele en React Native:**

- En Apple (iOS / tvOS) FairPlay suele requerir **código nativo (Swift)**.
- En Android / Android TV, Widevine también toca la capa nativa / un player serio.
- No es un `npm install` y listo.

**Qué se puede hacer en FE ahora**

1. Preguntar si DRM es MVP o fase 2 (pregunta #1 abajo).
2. Elegir estrategia de player:
   - Open source (`react-native-video` / `expo-av`) + módulos nativos → más trabajo.
   - Player comercial (Bitmovin, THEOplayer) → menos invento, más plata.
3. Dejar el player preparado para “license URL + certificado” aunque al principio use videos free.

**Cómo se hace (pasos)**

1. Confirmar proveedor de video (lo define el otro equipo).
2. Confirmar si hay FairPlay + Widevine en ese proveedor.
3. Spike de 1–2 días con un título de prueba DRM.
4. Si el open source no llega → evaluar player pago.
5. Probar en **device real** iOS y Android (simulador no alcanza para DRM serio).

---

### 5.2 Apple App Store y “cobramos solo en la web”

**Para tontos:** Apple quiere quedarse con un %. Si vendés acceso digital **dentro** de la app sin su sistema de compra (IAP), te pueden **rechazar** la app.

Cobrar solo en la web **puede** estar bien, pero hay que hacerlo **como dice Apple**, no “como nos conviene a nosotros”.

**Qué NO hacer en iOS / tvOS**

- Botón “Comprar suscripción — $9.99” que cobre adentro de la app.
- Checkout embebidísimo tipo tienda dentro de la app.
- Textos tipo “pagá acá más barato que en la App Store” (eso es veneno para review).

**Qué sí hacer (patrón seguro a validar con quien lleve store/legal)**

1. La app es de **acceso**: login → ver contenido si la cuenta ya tiene suscripción.
2. “Administrar suscripción” / “Suscribite” abre el **sitio web** (navegador), no un IAP improvisado.
3. No explicar precios agresivos ni descuentos anti-Apple en la UI de iOS.
4. Documentar el flujo para App Review (capturas + texto de “purchases on the web”).

**Qué puede hacer el FE ya**

- Auditar pantallas de Subscribe / Account.
- Separar copy iOS vs Web si hace falta.
- Deep link / `Linking.openURL` al portal web de billing (cuando exista la URL).

**Preguntar sí o sí** a producto/legal/store (no lo inventa el FE solo): ver sección 7.

---

### 5.3 Navegación TV (D-Pad / foco)

**Para tontos:** en TV no hay dedo. Hay flechas + OK + Atrás. Si el “foco” (el highlight amarillo/dorado) se pierde, la app **quedó inutilizable**.

React Native nació para touch. En TV se usa el fork **`react-native-tvos`** y se diseña la UI pensando en foco.

**Qué ya está en el repo**

- Detección `isTV`
- `TVFocusable` / `TVFocusGuide`
- Rail izquierdo en TV (en vez de tabs abajo)
- Anillos de foco en botones y cards
- Player: play/pause y menu por remoto

**Cómo se termina bien**

1. Probar en emulador Android TV / Apple TV simulator.
2. Armar checklist de foco (sección 6.3).
3. Corregir pantallas donde el foco se “muere” (modales, player, filas largas).
4. QA en **hardware real** (Fire TV / Google TV / Apple TV).

---

## 6. Qué hay que hacer (plan FE) y cómo

Pensalo en tres fases.

### Fase A — Cerrado (ya)

Objetivo: demo móvil/web usable.

| Qué                         | Cómo                                      |
| --------------------------- | ----------------------------------------- |
| Auth mock                   | `AuthContext` + AsyncStorage              |
| Catálogo / detalle / player | Pantallas en `src/screens`                |
| Gate premium                | Flag `hasActiveSubscription`              |
| Web + phone                 | `npm run web` / Expo Go                   |

**Criterio de listo:** alguien no técnico puede login → browse → play (free) → “suscribirse” mock → play premium.

---

### Fase B — TV usable (en curso / siguiente)

Objetivo: que con el remoto se pueda usar la app sin toque.

| Qué                    | Cómo                                               |
| ---------------------- | -------------------------------------------------- |
| Build TV               | `npm run prebuild:tv` + run android/ios TV         |
| Navegación             | Rail `TVTabBar` + `hasTVPreferredFocus`            |
| Listas                 | `TVFocusGuide` alrededor de filas horizontales     |
| Player                 | Controles focusables; `useTVEventHandler`          |
| Preview sin TV física  | `npm run web:tv` (`EXPO_PUBLIC_FORCE_TV=1`)        |

**Checklist de foco (imprimir y tachar)**

- [ ] Al abrir Home siempre hay un elemento enfocado
- [ ] Flechas mueven el foco de forma predecible
- [ ] OK abre detalle / play
- [ ] Atrás / Menu vuelve sin quedar “trabado”
- [ ] Subscribe y errores son navegables con D-Pad
- [ ] Al salir del player el foco vuelve a un lugar lógico
- [ ] Filas horizontales no “pierden” el foco al final

---

### Fase C — Integración (cuando exista BE)

Objetivo: sacar mocks.

| Qué              | Cómo (FE)                                      | Qué necesitás que te pasen      |
| ---------------- | ---------------------------------------------- | ------------------------------- |
| Login real       | Llamar API, guardar token                      | Endpoints + formato error       |
| Catálogo real    | Reemplazar `src/data/catalog.ts`               | JSON de episodios/thumbs/URLs   |
| Entitlement      | `hasSubscription` desde API                    | Campo claro active true/false   |
| Playback         | URL firmada / DRM license                      | Cómo pedir el stream            |
| Manage sub       | Botón → URL web de billing                     | URL staging + prod              |

**Orden recomendado:** Auth → entitlement → catálogo → player → billing link.

---

## 7. Preguntas que tenés que hacer (solo FE)

Mandá estas. No mezcles budget ni stack de servidor.

### Producto / UX

1. ¿El MVP es **solo VOD**, **solo live**, o **los dos**?
2. ¿Misma identidad visual en TV o pantallas TV rediseñadas?
3. ¿Les sirve el **rail lateral**, o quieren home tipo Netflix 100% filas?
4. ¿Qué se ve **sin** suscripción? (trailers, highlights free, nada…)
5. ¿UI en **inglés**, **español** o bilingüe?
6. Chromecast / AirPlay / PiP / offline: ¿MVP o después?

### App Store / suscripción (crítico)

7. ¿Confirmado que en **iOS/tvOS no hay compra in-app** y solo se administra en la web?
8. ¿Quién valida la estrategia contra las App Store guidelines (legal / PM / Apple consultor)?
9. ¿URL oficial de “manage subscription” / checkout web para deep link?

### DRM / video (para preparar el player)

10. ¿DRM es **obligatorio en el MVP** o fase 2?
11. Si hay DRM: ¿FairPlay + Widevine en **todas** las plataformas FE?
12. ¿Van con player open source o aceptan evaluar Bitmovin/THEOplayer?

### TV / QA

13. ¿Lista de devices “must” (ej. Apple TV 4K, Chromecast Google TV, Fire Stick)?
14. ¿Quién prueba en hardware real y con qué criterio de aceptación de foco?

### Integración (cuando haya BE)

15. ¿Contrato de API (auth, catálogo, subscription, playback) en staging?
16. ¿Ambiente de staging del portal web de billing?

---

## 8. Glosario ultra corto

| Término        | Significado en cristiano                                      |
| -------------- | ------------------------------------------------------------- |
| VOD            | Video guardado: lo ves cuando querés                          |
| Live           | Se transmite ahora                                            |
| Entitlement    | “¿Este usuario tiene permiso de ver esto?”                    |
| D-Pad          | Las flechitas del control remoto                              |
| Foco           | Qué botón/card está “seleccionado” ahora                      |
| DRM            | Candado del video                                             |
| FairPlay       | DRM de Apple                                                  |
| Widevine       | DRM de Google/Android                                         |
| IAP            | Compra dentro de la App Store de Apple                        |
| Prebuild TV    | Generar proyecto nativo ya configurado para TV                |
| react-native-tvos | Fork de RN que entiende Apple TV / Android TV              |

---

## 9. Estructura del código (mapa mental)

```
src/
  screens/          → pantallas (Login, Home, Player, …)
  components/       → botones, cards, filas
  context/          → auth + suscripción mock
  data/             → catálogo mock
  navigation/       → stacks/tabs + TVTabBar
  tv/               → isTV, TVFocusable, TVFocusGuide
  theme/            → colores
```

---

## 10. “¿Estamos bien?”

| Pregunta                         | Respuesta hoy                                      |
| -------------------------------- | -------------------------------------------------- |
| ¿Se pueden cerrar móvil y web?   | **Sí** — MVP demo listo                            |
| ¿Las TVs se pueden agregar?      | **Sí** — capa de foco ya empezada; falta QA device |
| ¿Bloquea que el BE lo haga otro? | **No** — se integra después                        |
| ¿Puede Apple rechazar la app?    | **Sí**, si el billing web se implementa mal        |
| ¿Puede doler el DRM después?     | **Sí**, si lo dejan para “el final”                |

---

## 11. Próximo paso sugerido (FE)

1. Mandar las **preguntas de la sección 7** (empezando por 1, 7, 10 y 13).
2. Mientras contestan: **checklist App Store** del flujo Subscribe + **QA foco TV** en emulador.
3. Cuando llegue staging: integrar auth + entitlement (sin tocar todavía DRM si dijeron fase 2).

---

*Doc generado para el equipo FE · proyecto Stu & Laurie Streaming · julio 2026*

---

## Ver también

Plan detallado: DRM nativo, live Bunny, emuladores TV, WooCommerce+USIO, rechazo Apple IAP → [`PLAN-DRM-LIVE-WOO-APPLE.md`](./PLAN-DRM-LIVE-WOO-APPLE.md)
