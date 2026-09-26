# Architecture

StockSense is a single Node.js application that follows a traditional **MVC** structure: Express
handles HTTP, EJS renders the pages on the server, Sequelize talks to MySQL, and a thin layer of
services holds the business logic. There is no separate frontend application and no UI build step.

```text
                        ┌──────────────────────────┐
   Browser  ──────────► │  Express routes          │
      ▲                 └───────────┬──────────────┘
      │                             │
      │                             ▼
      │                 ┌──────────────────────────┐
      │                 │  Controllers             │
      │                 └───────┬──────────┬───────┘
      │                         │          │
      │                         ▼          ▼
      │                 ┌─────────────┐  ┌──────────────────┐
      │                 │  Services   │  │  EJS views       │
      │                 └──────┬──────┘  │  layouts/        │
      │                        │         │  partials/       │
      │                        ▼         │  auth/ dashboard/│
      │                 ┌─────────────┐  └──────────────────┘
      │                 │  Sequelize  │
      │                 │  models     │
      │                 └──────┬──────┘
      │                        ▼
      └──────────────────  MySQL 8
        (HTML response)
```

A page request therefore travels
`Browser → routes → controller → service → model → MySQL → controller → EJS → Browser`.

---

## 1. Request lifecycle

The concrete flow for a protected page:

```text
GET /dashboard
  → helmet, cors, body parsers, cookie parser
  → locals middleware   (app name, nav data, view helpers, flash)
  → csrf issue          (signs a token into a cookie + res.locals)
  → csrf verify         (no-op for GET)
  → routes/index.js
      → dashboardRoutes: requireAuth
          → tokenService.extractToken  (HttpOnly cookie)
          → tokenService.verifyToken   (jwt.verify)
          → User.findByPk              (active check)
      → dashboardController.index
          → res.render('dashboard/index') through layouts/app.ejs
              → partials/sidebar, partials/navbar, partials/user-menu
              → partials/flash-message, partials/footer
```

Form submissions follow the same chain and end in a redirect, never in a JSON body:

```text
POST /login
  → csrf verify          (hidden _csrf field must match the signed cookie)
  → authRoutes: authLimiter → validateBody → authController.login
      → authService.login → User.scope('withPassword').findOne → bcrypt.compare
      → tokenService.signToken → setAuthCookie (HttpOnly)
      → res.redirect('/dashboard')
```

---

## 2. Layer responsibilities

| Layer | Location | Responsibility |
| ----- | -------- | -------------- |
| Entry point | `app.js` | View engine, static/vendor assets, locals, security, CSRF, route mounting, error handlers; verifies MySQL and starts the HTTP server when run directly. |
| Routes | `routes/` | Map URLs to controllers and attach middleware. No business logic. |
| Controllers | `controllers/` | Read the request, invoke validation and services, then render, redirect or return JSON. |
| Services | `services/` | Reusable business rules: registration, credential verification, tokens, OTP policy. |
| Models | `models/` | Sequelize definitions, validation, scopes, indexes. |
| Middleware | `middleware/` | Auth guards, validation, CSRF, flash, rate limiting, error translation. |
| Utils | `utils/` | `ApiError`, `asyncHandler`, `validators`, `logger`, `viewHelpers`. |
| Config | `config/` | `env.js`, `database.js`, `navigation.js`. |
| Views | `views/` | EJS presentation only. No queries, no business rules. |
| Public assets | `public/` | CSS design system, vanilla JS, images. |

The dependency direction is always downward: routes → controllers → services → models. A controller
never writes a query, and an EJS template never touches a model.

## 3. Controllers

- `authController` — renders the auth pages and handles the auth form posts.
- `pageController` — the `/` entry point.
- `dashboardController` — the dashboard plus one placeholder handler per planned module.

POST handlers share a single `formAction` helper so the same rule applies everywhere: re-render the
form with per-field errors on `422`, bounce back with a flash message on a handled failure
(`401`, `403`, `409`, `503`), and delegate anything unexpected to the central error handler.

Validation runs as middleware before the controller, so a failure there also has to end up back in
the form. `validateBody(schema, form)` therefore carries the originating view and title; the error
handler uses them to re-render that view with the field messages for browser requests, while API
clients still receive the plain `422` envelope.

---

## 4. Views, layouts and partials

`express-ejs-layouts` provides the layout mechanism. `app.set('layout', 'layouts/app')` is the
default; auth pages override it with `layout: 'layouts/auth'`, and the error pages use
`layout: false` because they render a complete standalone document.

| File | Purpose |
| ---- | ------- |
| `layouts/app.ejs` | Sidebar + top bar + content, used by every signed-in page. |
| `layouts/auth.ejs` | Split brand panel + centred form, used by all auth pages. |
| `partials/head.ejs` | Document head and the ordered stylesheet links. |
| `partials/brand.ejs` | Logo mark and wordmark. |
| `partials/sidebar.ejs` | Grouped navigation driven by `config/navigation.js`. |
| `partials/navbar.ejs` | Top bar shell. |
| `partials/user-menu.ejs` | Avatar, role, account link and the sign-out form. |
| `partials/flash-message.ejs` | One-shot message from the flash cookie. |
| `partials/footer.ejs` | Content footer. |
| `partials/form-field.ejs` | Label + input + inline error. |
| `partials/form-password.ejs` | Label + password input + visibility toggle + error. |
| `partials/page-header.ejs` | Breadcrumbs, title, subtitle, optional status badge. |
| `partials/card.ejs` | Card shell with header/body/footer slots. |
| `partials/empty-state.ejs` | Icon, title and explanation for empty screens. |
| `partials/foundation-checklist.ejs` | Phase 1 delivery status list. |
| `partials/planned-modules.ejs` | Module grid driven by `config/navigation.js`. |

EJS `include()` only exposes the object passed to it, so partials that receive optional data guard
it with `typeof x !== 'undefined'`.

---

## 5. Frontend behaviour

There is no framework. `public/js/` contains vanilla scripts that enhance the
server-rendered HTML and are safe to ignore if JavaScript is unavailable.

| File | Responsibility |
| ---- | -------------- |
| `common.js` | Off-canvas sidebar toggle with backdrop, profile dropdown, Escape handling. |
| `auth.js` | Password visibility, password rule indicators, six-box OTP input with auto-advance and paste, resend countdown, submit loading state. |

Every form still works without JavaScript: it posts normally and the server validates it. Scripts
are injected through `res.locals.pageScripts`, so a page loads only what it needs.

No `dashboard.js` or `products.js` exists yet because those pages have no interactive behaviour
until the inventory modules are implemented. Files are added when there is real interaction to
support, rather than as placeholders.

---

## 6. Database layer

- Sequelize connects to **MySQL only**, configured entirely from `DB_*` environment variables.
- `define.underscored` maps camelCase attributes to `snake_case` columns
  (`fullName` → `full_name`, `isActive` → `is_active`).
- `freezeTableName` keeps the physical table name predictable (`users`).
- `verifyConnection()` runs `sequelize.authenticate()` at startup; the process exits with a clear
  message when MySQL is unreachable.
- `npm run db:sync` runs `sequelize.sync()` to create or update tables in development. Production
  should use managed migrations.

### User model

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `INTEGER UNSIGNED` | Primary key, auto increment |
| `fullName` | `STRING(120)` | Not null, length validated |
| `email` | `STRING(191)` | Unique, indexed, validated, stored lower-cased |
| `password` | `STRING(255)` | bcrypt hash, never sent to a view |
| `role` | `ENUM` | `INVENTORY_MANAGER` or `WAREHOUSE_STAFF`, defaults to `WAREHOUSE_STAFF` |
| `isActive` | `BOOLEAN` | Deactivated accounts cannot sign in |
| `createdAt` / `updatedAt` | `TIMESTAMP` | Managed by Sequelize |

The default scope excludes `password`; only the explicit `withPassword` scope used during credential
verification includes it.

### Master Data models (Phase 2)

- **`Category`**: `id`, `name` (unique), `description`, `isActive`, timestamps. Has many `Product` with `RESTRICT` on delete.
- **`Product`**: `id`, `name`, `sku` (unique, uppercase), `categoryId` (FK), `unitOfMeasure`, `description`, `reorderLevel`, `reorderQuantity`, `isActive`, timestamps. Belongs to `Category`.
- **`Warehouse`**: `id`, `name`, `code` (unique, uppercase), `address`, `description`, `isActive`, timestamps. Has many `Location` with `RESTRICT` on delete.
- **`Location`**: `id`, `warehouseId` (FK), `name`, `code` (uppercase, unique scoped per warehouse), `description`, `isActive`, timestamps. Belongs to `Warehouse`.


## 7. Authentication design

1. `POST /login` looks the user up, compares the password with `bcrypt.compare`, and signs a JWT
   containing `sub`, `email` and `role`.
2. The JWT is written to an **HttpOnly cookie** (`ss_access_token`). It never appears in a response
   body and is never written to `localStorage` or `sessionStorage`.
3. "Remember me" controls the cookie lifetime: a persistent 8-hour `maxAge`, otherwise a session
   cookie that ends with the browser.
4. `requireAuth` resolves the cookie on every protected request and re-reads the user, so a
   deactivated account loses access immediately instead of waiting for the token to expire.
5. Anonymous visitors are redirected to `/login` with an explanatory flash message; signed-in users
   hitting `/login` are redirected to `/dashboard` by `redirectIfAuthenticated`.

### Cookie and CSRF notes

- `httpOnly` blocks script access, `secure` defaults to `true` in production, `sameSite` defaults to
  `lax`.
- Because authentication is now cookie-based **browser** forms rather than a token-based API, a
  double-submit CSRF token is enforced: `middleware/csrf.js` signs a random value into an HttpOnly
  cookie, exposes it as `res.locals.csrfToken`, and every form embeds it as `_csrf`. `verifyToken`
  runs before the routes, so a POST without a valid token is rejected with `403 CSRF_INVALID`
  before any controller runs.
- Helmet's CSP is disabled (`contentSecurityPolicy: false`) because the default policy would block
  the inline EJS-rendered markup pattern; all other Helmet headers remain enabled.

---

## 8. Error handling

One `errorHandler` translates `ApiError`, Sequelize validation/unique/connection errors and JSON
parse failures into a single result. It then decides how to respond using `prefersJson(req)`, which
is true for `/api/*` paths, XHR requests and clients that do not accept HTML:

- JSON clients receive the `{ success, message, code, errors }` envelope.
- Browsers receive `views/errors/404.ejs`, `views/errors/500.ejs` or `views/errors/429.ejs`.

Stack traces are only included in JSON responses outside production, and the 500 page shows a
generic message with the technical detail hidden in production.
