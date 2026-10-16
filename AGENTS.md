# AGENTS.md

Instructions for AI coding agents (and humans) working in this repository.

## Non-negotiable

**Expo HAS CHANGED.** Before writing or editing any code, read the exact
versioned docs that match this project: **Expo v57** →
<https://docs.expo.dev/versions/v57.0.0/>. Do not rely on generic or
newer-version Expo knowledge.

## Project overview

Stocks Home is a cross-platform (iOS / Android / Web) inventory-management
mobile app built with React Native + Expo and React Navigation. It talks to a
`django-ninja` REST backend for products, categories and stock movements, with
JWT authentication.

## Commands

| Task                    | Command            |
| ----------------------- | ------------------ |
| Install dependencies    | `npm install`       |
| Start (dev client)      | `npm start`         |
| Run on web              | `npm run web`       |
| Build & run Android     | `npm run android`   |
| Build & run iOS         | `npm run ios`       |

Type-check / lint: none are wired into `package.json` scripts yet;
`tsconfig.json` is strict and extends `expo/tsconfig.base`.

## Architecture (read `docs/` for details)

- `index.tsx` → `src/App.tsx` — bootstrap, provider tree, splash, deep linking.
- `src/context/` — `AuthContext` (JWT session, 401 handling) and `ThemeContext`.
- `src/api/` — thin Axios layer per resource + shared `axiosInstance`.
- `src/navigation/` — navigators and all screens (`auth`, `app`, `welcome`).
- `src/types/` — TypeScript contracts (mirror the backend JSON).
- `src/config/env.ts` — validates `EXPO_PUBLIC_API_URL` with zod.

## Conventions

- TypeScript, `strict: true`. Keep the `category_id`/`product_id` in vs
  `category`/`product` out mapping intact (documented in `src/types/`).
- Follow existing code style in the same folder; do not reformat unrelated code.
- Prefer editing existing components over adding new ones.
- This app is licensed **AGPL-3.0** (see `LICENSE`); keep license/author
  attribution intact.
