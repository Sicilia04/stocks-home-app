# Contributing to Stocks Home

Thanks for taking the time to contribute. This file describes how to fork,
branch, commit and open a pull request for **Stocks Home**.

- Read the [Code of Conduct](CODE_OF_CONDUCT.md) first.
- Look at the [Roadmap](ROADMAP.md) for ideas — **`good-first-issue`** items
  are perfect for a first contribution.
- Read [`docs/`][docs] before writing any code. `AGENTS.md` is a quick
  orientation for both humans and AI agents.

## Ground rules (short version)

This is an **Expo 57** project. Expo changes often and some of its newer
versions have breaking changes that do **not** apply here.

> **Non-negotiable:** before touching any code, read the versioned Expo docs
> for v57 — <https://docs.expo.dev/versions/v57.0.0/> — not the "latest" /
> generic docs.

Other things to keep in mind:

- TypeScript is `strict: true`. Avoid `any`, prefer explicit types.
- We follow **Conventional Commits** for commit messages (see below).
- No reformat of unrelated code. Match the local style in the folder you are
  editing (indent, quotes, naming).
- Prefer **editing existing components** over adding new ones.
- This app is **AGPL-3.0** licensed, © 2026 Florian Alu. Keep the license and
  author attribution intact. Do not remove `LICENSE` or the author header.

## Setting up a dev environment

```sh
git clone https://github.com/<your-fork>/stocks-home.git
cd stocks-home
npm install

# Configure the API URL for your local backend
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL
```

You can now run the app locally:

```sh
npm start        # dev client (recommended)
# or
npm run web
npm run android
npm run ios
```

> This project uses a **development build** (`expo start --dev-client`) and
> cannot be run directly with Expo Go.

## Workflow

### 1. Fork & branch

- Fork the repository on GitHub.
- Create a branch for your change. Convention:

  ```
  feat/<short-slug>       e.g. feat/home-blocks
  fix/<short-slug>        e.g. fix/401-redirect
  docs/<slug>             e.g. docs/roadmap
  chore/<slug>            e.g. chore/ci
  ```

### 2. Make your change

- Keep the diff focused: one PR = one concern (or a tightly related set).
- Run the app to verify your change works (manual smoke test). There is no
  test framework wired yet — please flag any new code paths worth covering.
- Don't commit secrets or machine-specific `.env.local` values.

### 3. Commit

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

Allowed types:

| Type      | Meaning                                            |
| --------- | -------------------------------------------------- |
| `feat`    | A new feature                                       |
| `fix`     | A bug fix                                           |
| `docs`    | Documentation only                                  |
| `style`   | Formatting, no logic change                         |
| `refactor`| Code change that neither fixes a bug nor adds a feature |
| `perf`    | Performance improvement                             |
| `test`    | Adding or updating tests                            |
| `build`   | Build system / dependencies                         |
| `ci`      | CI/CD configuration                                 |
| `chore`   | Misc maintenance                                    |

Optional scope: `auth`, `api`, `navigation`, `ui`, `config`, etc.

Examples:

```
feat(home): add low-stock block in home tabs
fix(auth): force logout on any 401 response regardless of route
docs(roadmap): list home-screen block ideas from local TODO
chore(deps): bump axios to 1.20.0
```

### 4. Push & open a PR

Push your branch to **your fork** and open a PR back to `Sicilia04/stocks-home`
on `develop`.

PR body template:

```md
## What
Short description of the change (and the issue it fixes, if any).

## Why
Motivation — what problem it solves, what improvement it brings.

## How to test
Steps for a reviewer to verify.

## Screenshots / demo
Optional — handy for UI changes.

## Checks
- [ ] Local build passes (`npm start`)
- [ ] I read `docs/DEVELOPMENT.md` and followed `CONTRIBUTING.md`
- [ ] License/author untouched (AGPL-3.0)
```

### 5. Review

- Expect at least one review from the maintainer before merge.
- Iterate on feedback, then the PR can be squashed and merged.
- After merge, re-sync your local branches and update your `develop`.

## Code style & conventions (detailed)

- **TypeScript**: `strict: true` (see `tsconfig.json`). No `@ts-ignore`
  without a comment explaining why.
- **Components**: one screen per file; split small presentational parts into
  `src/navigation/screens/app/components/`.
- **State**: local state with `useState`/`useReducer`; share app-wide state
  through a context in `src/context/` when truly needed (e.g. auth, theme).
- **API calls**: always go through `src/api/*.ts` files that use the shared
  `axiosInstance`. Do not create ad-hoc axios instances.
- **Types**: mirror the backend JSON contracts in `src/types/`. Keep the
  `category_id` (in) vs `category` (out) mapping intact.
- **Comments**: English, short, focused on *why*. Avoid noise in UI files.
- **Dependencies**: no new runtime dependency without justification (prefer
  existing libs in `package.json`).
- **Assets & permissions**: changes to `app.json` plugins (camera,
  secure-store…) must be documented in the PR description.

## What to avoid

- Reformatting / renaming unrelated code or files.
- Removing or changing `LICENSE`, the author header, or the `AGENTS.md`
  Expo-v57 warning.
- Committing `.env` with real API endpoints, tokens or credentials.
- Direct edits in `android/` or `ios/` (they are generated — use
  [config plugins](https://expo.dev/config-plugins/) instead).
- Bypassing the `AuthContext` to handle auth state.
- Adding comments in a different language than English.

## Where to look

- [`docs/ARCHITECTURE.md`][docs] — how the app is wired together.
- [`docs/API.md`][docs] — endpoints consumed and their JSON shapes.
- [`docs/DEVELOPMENT.md`][docs] — setup, running, env management.
- [`docs/PROJECT-STRUCTURE.md`][docs] — folder-by-folder map of `src/`.
- [`ROADMAP.md`][docs] — planned work and open questions.

## Licensing

By submitting a PR you agree that your contribution is licensed under
**AGPL-3.0** and that the original author attribution (Florian Alu, 2026)
remains in the project.

[docs]: ./docs
