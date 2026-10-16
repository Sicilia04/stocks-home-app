# Project Structure

A guided map of the repository root and `src/`. Use this to find the right file
before writing code; every path below exists in the repo.

```
stocks-home/
├── index.tsx                  # Entry: registers <App/> (Expo)
├── app.json                   # Expo config: name, scheme, plugins, bundle ids, newArch
├── App / src/App.tsx          # Provider tree, splash, deep linking, <Navigation/>
├── package.json               # Scripts, deps, metadata (author/license/repo)
├── tsconfig.json              # strict TS, extends expo/tsconfig.base
├── .env.example               # Documented placeholder for EXPO_PUBLIC_API_URL
├── .env(.development/.production) # Committed placeholder env (no secrets)
├── LICENSE                    # AGPL-3.0
├── README.md                  # Project overview + quickstart
├── CONTRIBUTING.md            # How to contribute, commit/PR conventions
├── CODE_OF_CONDUCT.md         # Contributor Covenant
├── AGENTS.md                  # Guidance for AI coding agents
├── ROADMAP.md                 # Planned blocks / features / tech-debt
├── assets/                    # App icons, splash, adaptive icon (app.json refs)
└── src/
```

## `src/` layout

```
src/
├── App.tsx                     # Root component: providers, splash, linking
├── types.d.ts                  # Global type augmentations
│
├── api/                        # Thin Axios layer, one file per resource
│   ├── axiosInstance.ts        # Shared instance: baseURL, JWT request interceptor, 401 responder
│   ├── auth.ts                 # getToken (POST /token/pair)
│   ├── user.ts                 # getMe, getUser
│   ├── product.ts              # CRUD /stock/products/
│   ├── category.ts             # CRUD /stock/categories/
│   └── movement.ts             # list/get/create /stock/movements/
│
├── config/
│   └── env.ts                  # zod validation of EXPO_PUBLIC_API_URL → API_BASE
│
├── context/
│   ├── AuthContext.tsx         # JWT session, restore, forceLogout, 401 registration
│   └── ThemeContext.tsx        # light/dark/system, persisted via SecureStore
│
├── navigation/
│   ├── index.tsx               # RootStack + AppTabs + AppStack, route types & icons
│   ├── AuthNavigator.tsx       # Welcome + Login stack
│   └── screens/
│       ├── welcome/WelcomeScreen.tsx
│       ├── auth/
│       │   ├── LoginScreen.tsx
│       │   └── forms/components/   # PasswordInput, DateField, Checkbox (shared field UI)
│       ├── app/
│       │   ├── HomeScreen.tsx
│       │   ├── MovementsListScreen.tsx
│       │   ├── MovementScreen.tsx          # movement detail
│       │   ├── MovementFormScreen.tsx      # out-movement flow + barcode scan
│       │   ├── ProductsScreen.tsx
│       │   ├── ProductFormScreen.tsx
│       │   ├── CategoriesScreen.tsx
│       │   ├── CategoryFormScreen.tsx
│       │   ├── ProfileScreen.tsx
│       │   ├── SettingsScreen.tsx
│       │   ├── NotFound.tsx
│       │   └── components/BarcodeScanner.tsx
│       └── LoadingScreen.tsx
│
├── hooks/
│   └── useMovementUserNames.ts # Caches user id→name for movement lists
│
├── types/                      # TS contracts mirroring backend JSON
│   ├── auth.ts
│   ├── user.ts
│   ├── product.ts              # includes the *WriteInput FK-mapping note
│   ├── category.ts
│   └── movement.ts
│
├── utils/
│   └── beep.ts                 # Audio beep on scan (iOS session rationale)
│
└── assets/
    ├── styles/                 # variables.tsx, global.tsx, per-screen style files
    ├── img/default_avatar.jpg
    ├── newspaper.png
    └── bell.png
```

## Where to look for X

| You want to…                                   | Start in                              |
| ---------------------------------------------- | ------------------------------------- |
| Change the API base URL / add another var       | `src/config/env.ts` + `.env*`        |
| Add a new endpoint                             | `src/api/<resource>.ts` (+ `src/types/`) |
| Change auth / token lifecycle / 401 handling   | `src/context/AuthContext.tsx`, `src/api/axiosInstance.ts` |
| Add a new screen / tab                         | `src/navigation/index.tsx` (+ `src/navigation/screens/`) |
| Change theming / colors                        | `src/context/ThemeContext.tsx`, `src/assets/styles/` |
| Adjust the scan flow / beep                    | `src/navigation/screens/app/MovementFormScreen.tsx`, `.../components/BarcodeScanner.tsx`, `src/utils/beep.ts` |

## Conventions that matter

- **FK mapping:** `category_id` / `product_id` on **write**, `category` /
  `product` on **read** (see `src/types/product.ts`, `src/types/movement.ts`).
- **One API file per resource**, all importing the shared `./axiosInstance`.
- **Strict TypeScript** — keep new code type-safe (`npx tsc --noEmit`).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the runtime data flow and
[API.md](./API.md) for the exact endpoint contracts.
