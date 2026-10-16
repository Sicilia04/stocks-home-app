# Architecture — Stocks Home

This document walks through the app end-to-end: providers, navigation,
authentication, theming, HTTP, and a few cross-cutting concerns. It is aimed
at **new contributors** — if you want to change something, you should be able
to find where it lives here.

> **Expo 57.** Read the versioned docs — <https://docs.expo.dev/versions/v57.0.0/> —
> before editing any code. (Also mirrored in [`AGENTS.md`](../AGENTS.md).)

## High-level shape

```
index.tsx
   │
   ▼
App            (src/App.tsx)
   ├── ThemeProvider              (src/context/ThemeContext.tsx)
   │     └── SafeAreaProvider    (react-native-safe-area-context)
   │           └── AuthProvider   (src/context/AuthContext.tsx)
   │                 └── Navigation (src/navigation/index.tsx)
   │                       ├── RootStack (native stack, no header)
   │                       │     ├── "Auth" → AuthStack (Welcome, Login)   ← !isAuthenticated
   │                       │     └── "App"  → AppStack                     ←  isAuthenticated
   │                       │           ├── Tabs (bottom tabs)
   │                       │           ├── MovementsList
   │                       │           ├── MovementForm   (modal)
   │                       │           ├── ProductForm    (modal)
   │                       │           ├── CategoryForm   (modal)
   │                       │           └── NotFound
   │                       └── (no other routes)
   └── (Asset preload: NavigationAssets, bell.png, newspaper.png)
```

### Provider responsibilities (in the order they wrap)

| Provider          | Responsibility                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| `ThemeProvider`   | Resolves `preferred ∈ {system, light, dark}` → effective `colorScheme`; persists in `expo-secure-store` (key `preferredTheme`).    |
| `SafeAreaProvider`| Wraps all screens with `react-native-safe-area-context` (insets, edge-to-edge).   |
| `AuthProvider`    | Manages the JWT session (token, user, isAuthenticated, loading). Restores session from `SecureStore` on mount. Registers the 401 handler with `axiosInstance` (`src/context/AuthContext.tsx:34`).   |

### The Navigation root

`src/navigation/index.tsx` is the single source of truth for routes:

- **`RootStack`** (no header) swaps between two siblings based on `isAuthenticated`:
  - **`Auth`** → `src/navigation/AuthNavigator.tsx` (Welcome → Login)
  - **`App`**  → `AppStack` below
- **`AppTabs`** (bottom tabs, no header): `HomeApp`, `MovementApp`, `ProductsApp`, `CategoriesApp`, `ProfileApp`
- **`AppStack`** (native stack, white header): pushes `MovementsList`, `MovementForm` (modal), `ProductForm` (modal), `CategoryForm` (modal), `NotFound` on top of the tabs.

All route params are typed in `src/navigation/index.tsx` — see
`AppStackParamList` / `AppTabsParamList` / `AuthStackParamList`.

## Authentication flow

All JWT handling lives in `src/context/AuthContext.tsx`.

1. **Mount** — `AuthProvider` runs a `useEffect` that reads
   `userToken` / `user` from `SecureStore`, sets session state, and flips
   `loading → false`.
2. **Login** (`src/navigation/screens/auth/LoginScreen.tsx:`)
   - `POST /token/pair` with `{username, password}` → `{access, refresh}`.
   - **`applyToken(access, refresh)`** persists the access token **before** any
     authenticated request, so the request interceptor can read it from
     `SecureStore` and attach it.
   - `GET /users/me/` → `User`
   - `login(access, user)` stores the user + token and flips
     `isAuthenticated → true` (which re-renders the RootStack with the App).
3. **Every subsequent request** — `axiosInstance.interceptors.request` reads
   `userToken` from `SecureStore` and sets `Authorization: Bearer …`.
4. **Any 401** — `axiosInstance.interceptors.response` calls the
   `unauthorizedHandler` registered by `AuthProvider`, which in turn calls
   `forceLogout()` (clears SecureStore, `setIsAuthenticated(false)`). The
   RootStack reactively falls back to the Auth flow.
5. **Manual logout** — from any screen (e.g. Profile), simply call
   `logout()` from `useAuth()`.

> Note: the refresh token is **stored** but not yet used to silently renew
> the access token. See [ROADMAP.md](../ROADMAP.md) → open question Q2.

## Theming

```ts
PreferredScheme = 'system' | 'light' | 'dark'
colorScheme     = 'light' | 'dark'   // effective value
```

- Persisted as a string under `preferredTheme` in `SecureStore`.
- `preferred === 'system'` follows `useColorScheme()` at render time, so a
  system change (e.g. dark mode at night) is picked up live without a restart.
- `App.tsx` maps `colorScheme` to `DefaultTheme` / `DarkTheme` for
  React Navigation and passes it to `NavigationContainer`.

## HTTP & data

### The shared axios instance (`src/api/axiosInstance.ts`)

- `baseURL` = `API_BASE`, from `src/config/env.ts` (zod-validated).
- Request interceptor attaches `Authorization: Bearer <token>` if present.
- Response interceptor forwards `401` to `unauthorizedHandler` (set by
  `AuthProvider`).
- No other interceptors — keep it thin.

### Per-resource modules (`src/api/*.ts`)

| File          | Endpoints                                                        |
| ------------- | ---------------------------------------------------------------- |
| `auth.ts`       | `POST /token/pair`                                              |
| `user.ts`       | `GET /users/me/`, `GET /users/{id}/`                            |
| `product.ts`    | `GET /stock/products/`, `GET/POST/PATCH/DELETE /stock/products/{id}/` |
| `category.ts`   | `GET /stock/categories/`, `GET/POST/PATCH/DELETE /stock/categories/{id}/` |
| `movement.ts`   | `GET /stock/movements/`, `GET /stock/movements/{id}/`, `POST /stock/movements/` |

> **FK mapping rule.** The API expects `category_id` / `product_id` on write,
> and returns `category` / `product` on read. Keep this intact in
> `src/types/` and in the API call sites. See
> [`src/types/product.ts:13`](../src/types/product.ts) and siblings.

### Error shape & user-facing alerts

Errors are caught at the screen level with a small helper
(`getErrorMessage(...)`) and shown via `Alert.alert` (e.g.
`src/navigation/screens/app/MovementFormScreen.tsx`). Centralising this in a
toast/HUD component is on the [Roadmap](../ROADMAP.md) (tech-deduction: keep
Alert for now).

## Splash & deep linking

- `App.tsx` calls `SplashScreen.preventAutoHideAsync()` **before** rendering,
  then `onReady` → `SplashScreen.hideAsync()`.
- Deep links use the scheme defined in `app.json`
  (`"scheme": "stockshome"`). The `linking.prefixes` in `App.tsx` MUST match
  (`'stockshome://'`). Change both together.
- `expo-linking` + React Navigation v7 handle URL parsing — no custom config
  is required as long as route names match.

## Barcode scan (`src/navigation/screens/app/components/BarcodeScanner.tsx`)

- Wraps `expo-camera`'s `CameraView` in a permission + lifecycle wrapper.
- Props:
  - `onScanned(code)` — callback on successful scan.
  - `onCancel?` — render a close button.
  - `continuous` — keep scanning (used for fast **out**-movements); applies an
    anti-duplicate cooldown of 3s for the same code / 500ms for a different one.
  - `feedback` — optional `{kind, text}` banner for inline success/error state.
- The component only emits `result.data` after a 250ms debounce, to absorb
  camera re-focus wobble.
- Callers:
  - **`MovementFormScreen`** (out flow, continuous + inline feedback + `playBeep` on success).
  - **`ProductFormScreen`** (single-shot, no continuous).

## Sound

- `src/utils/beep.ts` — plays a short **retire** beep (WAV asset at
  `assets/sounds/retire_beep.wav`) via `expo-audio`.
- iOS audio session is forced to `playAndRecord` while the camera is active so
  that routing goes over the speaker (not the earpiece).
- Called exactly once, from `MovementFormScreen.handleOutScan` after a
  successful `createMovement`.

## Where to add new things (recipes)

### "I want a new API endpoint"

1. Add a TS type for the payload / response in `src/types/<resource>.ts`.
2. Add a function in `src/api/<resource>.ts` (use `axiosInstance` from
   `./axiosInstance`, never `axios` directly).
3. Reference the new function from the calling screen.
4. Document the endpoint in [`API.md`](API.md).

### "I want a new screen"

1. Create the component under `src/navigation/screens/app/` (or `auth/`).
2. Add a route entry to the appropriate navigator in
   `src/navigation/index.tsx` **and** extend the `AppStackParamList` /
   `AppTabsParamList` types (or create a new param list) so navigation is typed.
3. If it needs to be reachable from the bottom bar, add it to `AppTabs` and
   extend `TAB_ICON_MAP`.
4. Update [`PROJECT-STRUCTURE.md`](PROJECT-STRUCTURE.md).

### "I want a new context"

1. Create `src/context/MyContext.tsx` exporting `MyProvider` + `useMy()` (the
   standard throw-outside pattern — see `ThemeContext.tsx:60` /
   `AuthContext.tsx:103`).
2. Wrap once in `src/App.tsx` (outermost = least specific, innermost = most
   specific).
3. If it needs to react to auth changes, place it **inside** `AuthProvider`.

### "I want a new util / hook"

- Util → `src/utils/<name>.ts` (pure, no React).
- React hook → `src/hooks/use<Name>.ts` (export the hook, default export
  optional but consistent with the folder).

## Testing & quality

There is no test framework wired in this repo yet — see [Infra-1](../ROADMAP.md#infrastructure)
in [ROADMAP.md](../ROADMAP.md). As a stopgap, every PR should:

- Build locally (`npm start`, `npm run web`, `npm run android`, `npm run ios`)
- Manually smoke-test the flow (login → CRUD on at least one resource).
- Keep `tsc` clean (`tsconfig.json` is strict).

## Glossary

| Term        | Meaning                                                              |
| ----------- | -------------------------------------------------------------------- |
| *Movement*  | A stock change: `kind: 'in' \| 'out'` + `quantity` against a product |
| *EAN-8/13*  | Code-barres standard supportée par le scanner (regex dans `MovementFormScreen`) |
| *Low stock* | `product.quantity <= product.min_quantity` (or `is_low_stock` flag from the backend) |
| *Out-movement* | Stock decrement flow; triggers the audio beep and a 1-unit-by-default UX in the scanner |
