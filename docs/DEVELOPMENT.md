# Development Guide

Everything a developer needs to get a local build of Stocks Home running,
configure the environment, and debug against the backend.

> **Expo 57.** This project targets **Expo v57**. Do not copy-paste instructions
> from Expo Go-era tutorials or newer-version docs. When in doubt, reference the
> versioned v57.0.0 docs.

## Prerequisites

- **Node.js** (LTS) and **npm**
- A working **Expo dev build** toolchain. This project uses a
  **development client** (`expo-dev-client`, `npm start` runs
  `expo start --dev-client`), **not** Expo Go. That is required because of the
  native modules below (SecureStore, Camera, Audio, Splash, SystemUI) which are
  not bundled in Expo Go.
- For native targets: Android Studio (Android) and/or Xcode (iOS).
- A backend instance (the `django-ninja` API) reachable from your machine/device.

## Setup

```bash
npm install
```

Then create your environment file (see [Environment variables](#environment-variables)).

## Running

| Task                    | Command         | Notes                                              |
| ----------------------- | --------------- | -------------------------------------------------- |
| Start the metro server (dev client) | `npm start` | Exposes the JS bundle; scan/connect a dev-client build |
| Run on web              | `npm run web`   | Quick UI iteration, no native modules (camera/securestore unavailable) |
| Build & run Android     | `npm run android` | `expo run:android` — compiles a native dev build   |
| Build & run iOS         | `npm run ios`   | `expo run:ios` — macOS/Xcode required              |

### Native (Android / iOS)

1. `npm start` (keeps the server running in a dedicated terminal),
2. `npm run android` or `npm run ios` to produce & launch a dev-client build,
3. Point the build at your backend via the env var (see below).

> On a physical Android device over LAN, the backend URL in your `.env` must be
> the **host machine's LAN IP** (e.g. `http://192.168.1.1:8000/api`), not
> `localhost` — the device cannot reach your local `localhost`.

### Web

`npm run web` is fine for layout/flow work. Native-only features (barcode
scanner, secure token store, audio beep) will not function — they degrade or
are mocked by the web layer.

## Environment variables

Driven by Expo's `EXPO_PUBLIC_*` convention: variables with that prefix are
**inlined into the JS bundle at compile time by Metro** (they are not read at
runtime). Changing them requires a rebuild / restart of the bundle.

| Variable                | Required | Description                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`   | yes      | Base URL of the backend. Must start with `http(s)://`.            |

Validation happens at startup in `src/config/env.ts` using **zod**. If the
variable is missing, empty, or not a valid URL, the app **crashes immediately
with a clear message** — by design, so a bad config is never swallowed.

### File resolution order

Expo loads files in this order (earlier files win):

1. `.env.local`
2. `.env.development.local` / `.env.production.local`
3. `.env`
4. `.env.development` / `.env.production`

`.env*.local` files are **gitignored**; `.env*` (non-local) files are
committed to the repo with **placeholder** values only (no secrets). To override
per machine without touching the committed file, put your value in `.env.local`.

> **Convention:** never commit real secrets. The committed `.env*` files contain
> only the LAN-dev / example placeholder for `EXPO_PUBLIC_API_URL`.

## Native modules / plugins

Configured in `app.json` → `expo.plugins`:

| Plugin            | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `expo-asset`      | Asset bundling                                       |
| `expo-splash-screen` | Splash screen config (background + icon)           |
| `expo-secure-store` | Encrypted storage for the JWT token            |
| `expo-camera`     | Barcode scanning (permission string configured)     |
| `expo-system-ui`  | Nav bar / status bar theming                         |

`expo-audio` (the scan beep) is used at runtime; `expo-linking` handles the
deep-link scheme `stockshome://` and the root redirect. `newArchEnabled` is
`true` (React Native New Architecture / Fabric).

> `app.json` currently keeps a **French** camera permission string
> (`expo.cameraPermission`). If you are adding non-French locales, review it.

## Debugging

- **Metro:** on `npm start`, `r` reloads the JS, `shift+r` does a full reload,
  `shift+i` opens devtools (native builds).
- **Logs:** `console.log` shows in the Metro terminal (native) or browser devtools
  (web).
- **Network:** inspect requests in the devtools Network tab (web) or a proxy
  like Charles/mitmproxy (native) to verify the `Authorization: Bearer …` header
  and `baseURL`.
- **Bad env / 401:** both surface as app-level events — see [API.md](./API.md)
  for the 401 → `forceLogout` handling and `src/config/env.ts` for startup
  validation.

## Type-checking / lint

There is **no dedicated lint or typecheck script** wired into `package.json`
yet. However:

- The TypeScript config is **strict** (`tsconfig.json` extends
  `expo/tsconfig.base`, `strict: true`, `moduleResolution: "bundler"`).
- You can type-check manually with: `npx tsc --noEmit`.
- Metro will surface type/compile errors on reload.

Keep code type-safe and idiomatic — there is no CI gate for it, so this is on
the contributor.

## Build & release notes

- `version` is managed in `app.json`; bump it per release.
- Bundle ids: `fr.grapps.stockshome` (both iOS & Android) — keep them consistent
  across environments.
- Deep-linking uses the scheme `stockshome://`.
