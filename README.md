# Stocks Home

[![license][license-badge]](#license)
[![platforms][platforms-badge]](#platforms)
[![expo-57][expo-badge]][expo-docs]
[![react-navigation][rn-badge]][rn-docs]

**Stocks Home** is a cross-platform [iOS / Android / Web][platforms] inventory
management mobile app. Scan barcodes or pick a product, record stock *in* and
*out* movements, keep track of low stock, and organise items into categories.
It is built with **React Native**, **Expo 57** and **React Navigation**, talking
to a `django-ninja` REST backend for authentication and data.

## Features

- JWT authentication (`/token/pair`) and automatic session restore on launch
- Product & category CRUD (create / read / update / delete)
- Stock *in* / *out* movements with per-product quantity and min-stock alerting
- Built-in barcode scanner (camera) + a retro beep on successful scan
- Dark / light theme, following system or user preference (persisted)
- Web, iOS and Android support out of the box

## Tech stack

| Layer        | Choice                                                        |
| ------------- | ------------------------------------------------------------- |
| Runtime       | [Expo 57][expo-docs] (dev client, not Expo Go)               |
| UI framework  | [React Native 0.86](https://reactnative.dev/) + [RN Web](https://necolas.github.io/react-native-web/) |
| Navigation    | [React Navigation v7](https://reactnavigation.org/) (native stack + bottom tabs) |
| Forms & state | [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.sh/)    |
| HTTP          | [axios](https://axios-http.com/) with interceptors + `SecureStore` |
| Storage       | `expo-secure-store` (tokens, theme preference)                |
| Types         | TypeScript (strict)                                           |

## Platforms

- iPhone / iOS (dev build, `expo run:ios`)
- Android (dev build, `expo run:android`)
- Web (`npm run web`)

## Getting started (local)

### Prerequisites

- **Node.js** 20+ and npm
- **Expo 57** (installed via `npm install`)
- For native builds: Android SDK (Android) and Xcode (iOS)
- A running `django-ninja` backend the app can reach (or a LAN IP if running on device)

### 1. Install

```sh
npm install
```

### 2. Configure the API URL

```sh
cp .env.example .env        # (Windows: copy .env.example .env)
# then edit the value of EXPO_PUBLIC_API_URL
```

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `.env`                | Default (production-style)                          |
| `.env.development`    | LAN example (`http://192.168.1.1:8000/api`)       |
| `.env.production`     | Production value                                  |
| `.env.local`          | Per-machine override (gitignored)                 |

The value is validated at build time by `src/config/env.ts`; a missing or
malformed URL will fail the build with a clear message.

### 3. Run

```sh
# Dev client (recommended)
npm start

# Web
npm run web

# Native
npm run android     # Android dev build
npm run ios         # iOS dev build
```

> This project uses a **development build** and cannot be run with **Expo Go**.
> Use `npm start` / the native scripts above.

## Project structure

```
.
├── index.tsx                # bootstrap — registers the root component
├── app.json                 # Expo config (name, scheme, plugins, icons)
├── assets/                  # icons, splash, sounds
├── src/
│   ├── App.tsx              # provider tree (Theme > Auth > Navigation)
│   ├── config/
│   │   └── env.ts           # zod-validated env vars (EXPO_PUBLIC_API_URL)
│   ├── context/
│   │   ├── AuthContext.tsx  # JWT session, restore, force-logout on 401
│   │   └── ThemeContext.tsx # light / dark / system, persisted
│   ├── api/
│   │   ├── axiosInstance.ts # shared axios + 401 handler
│   │   ├── auth.ts          # POST /token/pair
│   │   ├── user.ts          # GET /users/me/
│   │   ├── product.ts       # CRUD /stock/products/
│   │   ├── category.ts      # CRUD /stock/categories/
│   │   └── movement.ts      # list / get / create /stock/movements/
│   ├── types/               # TypeScript contracts (mirror backend JSON)
│   ├── navigation/
│   │   ├── index.tsx        # Root/Auth/App stack + bottom tabs
│   │   ├── AuthNavigator.tsx
│   │   └── screens/         # auth / app / welcome (+ BarcodeScanner)
│   ├── hooks/
│   │   └── useMovementUserNames.ts
│   └── utils/
│       └── beep.ts          # retro "retire" beep via expo-audio
├── docs/                    # developer docs
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEVELOPMENT.md
│   └── PROJECT-STRUCTURE.md
├── AGENTS.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── ROADMAP.md
├── LICENSE                  # AGPL-3.0
└── README.md
```

## Environment variables

| Variable              | Required | Example                                        | Purpose             |
| --------------------- | -------- | ---------------------------------------------- | ------------------- |
| `EXPO_PUBLIC_API_URL` | yes      | `http://192.168.1.1:8000/api` / `https://…/api` | Backend base URL   |

Only public variables (`EXPO_PUBLIC_*`) are exposed to the client. Never put
secrets there.

## Architecture in 30 seconds

- `src/App.tsx` wraps the app in `ThemeProvider` → `AuthProvider` → `Navigation`.
- `Navigation` is a **root stack** that switches between the **Auth** and **App**
  stacks based on `isAuthenticated` (from `useAuth()`).
- The **App** stack is a native stack containing the bottom tabs
  (Home, Movements, Products, Categories, Profile) plus form screens
  (Movement, Product, Category) opened as modals.
- All HTTP goes through a single `axios` instance
  (`src/api/axiosInstance.ts`) which injects the JWT and forwards any `401` to
  the `AuthContext` for a forced logout + navigation reset.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a full walkthrough.

## Contributing

Contributions are welcome! Please read
[`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a PR, and be a good human —
see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Feature ideas live in
[`ROADMAP.md`](ROADMAP.md) — look for the `good-first-issue` tag.

## License

Released under the [GNU Affero General Public License v3.0](LICENSE)
(AGPL-3.0), © 2026 **Florian Alu**. Short version: you can install, run,
share and modify — but any modification you share back with the community must
stay under the same license and keep the original author attribution. For
re-use or commercial purposes outside those bounds, contact the author.

[license-badge]: https://img.shields.io/badge/license-AGPL--3.0-blue.svg
[platforms-badge]: https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-111.svg
[expo-badge]: https://img.shields.io/badge/Expo-57-black.svg
[rn-badge]: https://img.shields.io/badge/React%20Navigation-7-blue.svg
[expo-docs]: https://docs.expo.dev/
[rn-docs]: https://reactnavigation.org/
[platforms]: https://docs.expo.dev/workflow/continuous-native-generation/
