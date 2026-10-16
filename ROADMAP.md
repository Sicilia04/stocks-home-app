# Stocks Home — Roadmap

This file tracks the planned work for **Stocks Home**. It is intentionally a
single, ordered, easy-to-skim list so that external contributors can pick up
an item, label it with `good-first-issue` for their scope and ship a PR.

If you want to contribute to one of these items, see
[CONTRIBUTING.md](CONTRIBUTING.md) and check in on the
[issues board](https://github.com/Sicilia04/stocks-home/issues) — if the item
isn't there yet, open an issue so we can coordinate.

Legend / tags used in the repo:

- `good-first-issue` — small, self-contained, ideal for a new contributor
- `enhancement` — new or improved feature
- `bug` — unexpected behaviour to fix
- `docs` — documentation / README
- `help-wanted` — maintainer explicitly asks for help
- `wontfix` / `someday` — low priority

> A PR that closes an item from this list should reference it in the PR
> description (e.g. `Closes roadmap item #Home-1`).

---

## 🎯 Home screen — four blocks (top priority)

On the **HomeApp** tab, add four self-contained cards/blocks. Each block
should be its own component under
`src/navigation/screens/app/components/` and take the data it needs
as props, so it is easy to compose and test.

| ID      | Block                 | Description                                                        |
| ------- | --------------------- | ------------------------------------------------------------------ |
| Home-1  | **Attention** (low stock) | List products with `is_low_stock` (or `quantity <= min_quantity`). Show badge with count. Tap → filtered Products list. |
| Home-2  | **Last movement**   | Show most recent `StockMovement` (product, kind in/out, quantity, user, time). Tap → `MovementsList`. |
| Home-3  | **+ Add product**   | Quick action that navigates to `ProductForm` (no `productId` in route params → "Nouveau produit" title). |
| Home-4  | **+ Add category**  | Quick action that navigates to `CategoryForm` (no `categoryId` in route params). |

Notes:

- Block 1 can call `listProducts()` and filter client-side (small data set).
- Block 2 can call `listMovements()` sorted desc by `created`, or a new
  backend endpoint `GET /stock/movements/latest/` if preferred (open an issue
  to discuss).
- Blocks 3 and 4 are pure navigation — no data fetching.

Related issues: open one per block, tag `good-first-issue` + `enhancement`.

## 🔎 Movements

- **Movements-1** — Add search / filter on product name in `MovementsListScreen`.
- **Movements-2** — Pagination (or "load more") on movements list.
- **Movements-3** — Backend: `DELETE /stock/movements/{id}/` (currently not
  implemented in the API — open an API issue on the django-ninja repo).

## 📦 Products & categories

- **Products-1** — Search by name / barcode in `ProductsScreen`.
- **Products-2** — Barcode scan inside the product *detail* form (re-use the
  existing `BarcodeScanner` component).
- **Products-3** — Sort order (name A→Z, stock desc, recent updated).
- **Categories-1** — Sort categories alphabetically or by product count.
- **Categories-2** — Drag & drop reordering (backend change: add `order` field).

## 👤 Profile & settings

- **Profile-1** — Change password on the frontend (backend endpoint needed).
- **Profile-2** — Change display name / avatar upload.
- **Settings-1** — Persist "beep on out-movement" toggle (currently always on
  via `src/utils/beep.ts`).

## 🛠️ Infrastructure

- **Infra-1** — Add ESLint + Prettier and wire `npm run lint`, `npm run format`.
- **Infra-2** — Add Jest + React Native Testing Library for basic coverage.
- **Infra-3** — Set up GitHub Actions: `npx expo-doctor` + `npx tsc --noEmit`
  on PRs.
- **Infra-4** — i18n (the UI is currently French; add a `fr` / `en` locale
  switch without breaking existing strings).
- **Infra-5** — Offline queue for stock *out* movements (write locally, push
  when back online).

## 🧹 Tech debt

- **Debt-1** — `src/App.tsx` still uses `require()` for 2 assets — switch to
  the `expo-asset` helper for consistency.
- **Debt-2** — `useMovementUserNames` can be extracted into a proper `useUsers`
  hook with `useRequest` semantics and typed cache.
- **Debt-3** — Consolidate style constants (`src/assets/styles/*`) into a
  single theme object so screens don't re-define paddings/colours.

## ❓ Open questions (need maintainer input)

- **Q1** — Should the home "Attention" block show *all* low-stock products or
  only the top-N?
- **Q2** — Is a refresh token flow planned, or is short-lived access-token
  rotation the intended model?
- **Q3** — Do we want to gate "in/move" with a PIN on the app (kiosk mode)?

## 🗑️ Backlog / someday

- Multi-store support (per-branch stock).
- Reports / CSV export of stock movements.
- Barcode generation on the print side.
- PWA install prompt on web.
- Voice entry for quantity (offline).

---

## How to propose a new item

1. Open an issue with a **clear title**, a **`Type:`** line (`enhancement` /
   `bug` / `docs` / `good-first-issue`) and 2–3 sentences of context.
2. Link it to an existing roadmap item (or ask to add it).
3. Once agreed, the entry is added here and the issue is labelled.
