# API Reference

Stocks Home is a **client-only** app. It talks to a `django-ninja` REST backend
for products, categories, stock movements and authentication (JWT). This doc
lists exactly the endpoints the frontend consumes, the JSON shapes it expects,
and the shared HTTP rules (base URL, auth header, 401 handling).

> The backend is **not** part of this repository. If you are a new contributor,
> these are the contracts you must satisfy for the app to work.

## Base URL

- Resolved once at startup from `EXPO_PUBLIC_API_URL` (see
  [DEVELOPMENT.md](./DEVELOPMENT.md) and `src/config/env.ts`).
- Validated with **zod** — the app will crash early with a clear message if the
  value is missing or not a valid `http(s)://` URL.
- Baked into the build at compile time (the `EXPO_PUBLIC_` prefix is an Expo
  convention for runtime-embedded env vars).

## Shared HTTP rules

### Instance

A single shared Axios instance lives in `src/api/axiosInstance.ts`:

- `baseURL` = `API_BASE`
- `Content-Type: application/json`

### Request interceptor — JWT

Before every request, the interceptor reads the token from
`expo-secure-store` (key `userToken`) and, if present, attaches:

```
Authorization: Bearer <token>
```

There is no "remember me" vs "session" split — the token is always used when
stored.

### Response interceptor — 401

On any `401` response, the interceptor invokes a single registered
`unauthorizedHandler` (set at runtime by `AuthContext` via
`setUnauthorizedHandler`). That handler calls `forceLogout()`, which:

1. Clears SecureStore,
2. Resets the auth state,
3. Navigates to the auth flow.

The original `Promise` is **still rejected**, so the calling code must treat
the request as failed.

### Delete responses

`django-ninja` returns **204 No Content** on successful `DELETE`. The frontend
simply awaits the promise; no body is parsed.

## Endpoints

### Auth

| Method | Path            | Description                     | Frontend fn      |
| ---- | --------------- | ------------------------------- | ---------------- |
| POST | `/token/pair`   | Obtain a JWT pair. Body: `{username, password}`. Response includes `access`. | `getToken` |

The `access` token is what gets stored under `userToken`.

### User

| Method | Path            | Description                       | Frontend fn |
| ---- | --------------- | --------------------------------- | ----------- |
| GET  | `/users/me/`    | Current authenticated user        | `getMe`     |
| GET  | `/users/{id}/`  | A user by id (string) — used to resolve movement actor names | `getUser` |

### Products

Base: `/stock/products/`

| Method | Path                 | Body / Params            | Frontend fn    |
| ---- | -------------------- | ------------------------ | -------------- |
| GET  | `/stock/products/`   | —                        | `listProducts` |
| GET  | `/stock/products/{id}/` | —                    | `getProduct`   |
| POST | `/stock/products/`   | `ProductWriteInput`      | `createProduct`|
| PATCH| `/stock/products/{id}/`| `ProductWriteInput`  | `updateProduct`|
| DELETE| `/stock/products/{id}/`| —                    | `deleteProduct`|

### Categories

Base: `/stock/categories/`

| Method | Path                      | Body / Params            | Frontend fn      |
| ---- | ------------------------- | ------------------------ | ---------------- |
| GET  | `/stock/categories/`      | —                        | `listCategories` |
| GET  | `/stock/categories/{id}/` | —                        | `getCategory`    |
| POST | `/stock/categories/`      | `CategoryWriteInput`     | `createCategory` |
| PATCH| `/stock/categories/{id}/` | `CategoryWriteInput`     | `updateCategory` |
| DELETE| `/stock/categories/{id}/` | —                       | `deleteCategory` |

### Stock movements

Base: `/stock/movements/`

| Method | Path                       | Body / Params           | Frontend fn    |
| ---- | -------------------------- | ----------------------- | -------------- |
| GET  | `/stock/movements/`        | —                       | `listMovements`|
| GET  | `/stock/movements/{id}/`   | —                       | `getMovement`  |
| POST | `/stock/movements/`        | `StockMovementWriteInput` | `createMovement` |

> The frontend currently only creates and reads movements. Update/delete are
> intentionally not wired (product decision — see [ROADMAP.md](../ROADMAP.md)).

## JSON contracts (`src/types/`)

The TypeScript types in `src/types/` mirror the backend JSON.

### ⚠️ Foreign-key mapping (read carefully)

This is the single most important convention for anyone adding a screen that
submits data:

| Direction | What you send / receive |
| --------- | ----------------------- |
| **In** (write payloads) | `category_id`, `product_id` (numeric FK ids) |
| **Out** (read responses) | `category`, `product` (embedded objects) |

The `*WriteInput` types carry the FK ids; the plain `Product` /
`StockMovement` types carry the embedded objects. Do **not** flip this — the
backend does not accept embedded objects on write and does not return bare ids
on read. See the notes in `src/types/product.ts` and `src/types/movement.ts`.

## Adding a new endpoint (recipe)

1. Define the types in `src/types/<resource>.ts` (write + read shapes, keep the
   FK mapping intact).
2. Add the function(s) in `src/api/<resource>.ts`, reusing the shared instance
   (`import axios from "./axiosInstance"`).
3. Call them from a screen/hook. No extra wiring is needed — the auth header
   and 401 handling are already global.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how these fit into the app.
