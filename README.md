# StockSense — Smart Inventory Management System

A modular inventory management web application that replaces manual registers, Excel sheets and
scattered stock tracking with a single, centralised system.

StockSense follows a **traditional MVC architecture** on a single Node.js application:

```text
Browser → Express routes → Controllers → Services → Sequelize Models → MySQL
                        └► EJS Views ────────────────────────────────┘
```

**Delivered in this repository:** the project foundation, the design system, the authentication
pages and the protected dashboard shell. The inventory modules themselves are intentionally *not*
implemented and render clean empty states instead of fabricated data.

---

## 1. Project overview

StockSense serves two user groups:

| Role | Responsibilities |
| ---- | ---------------- |
| **Inventory Manager** | Manage products, warehouses, receipts, deliveries and stock adjustments. |
| **Warehouse Staff** | Perform transfers, picking, shelving and inventory counting. |

---

## 2. Technology stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Node.js | >= 20.19 | Runtime |
| Express | ^5.1.0 | HTTP framework and routing |
| EJS | ^3.1.10 | Server-side templating |
| express-ejs-layouts | ^2.5.1 | Layout wrapper for EJS |
| Sequelize | ^6.37.7 | ORM |
| MySQL (mysql2) | ^3.15.3 | Database driver |
| jsonwebtoken | ^9.0.2 | JWT issuing and verification |
| bcryptjs | ^3.0.2 | Password hashing (bcrypt algorithm, no native build) |
| Bootstrap | ^5.3.8 | Grid and responsive utilities |
| Bootstrap Icons | ^1.13.1 | Single, consistent icon set |
| helmet, cors, cookie-parser, express-rate-limit, morgan, dotenv | — | Security headers, CORS, cookies, throttling, logging, env loading |
| Vanilla JavaScript | — | Progressive enhancement only |

**There is no React, no Vite, no JSX and no frontend build step.** The browser receives fully
rendered HTML from Express. Development tooling is Nodemon and ESLint.

> The project uses **MySQL only**. MongoDB and other databases are not used.

---

## 3. Project structure

```text
stocksense/
├── config/                   # env.js, database.js, navigation.js
├── controllers/              # authController, pageController, dashboardController
├── middleware/               # authenticate, validation, csrf, flash, rateLimiters, errorHandler
├── models/                   # User.js, index.js
├── routes/                   # index.js, pageRoutes.js, authRoutes.js, dashboardRoutes.js
├── services/                 # authService, tokenService, otpService
├── utils/                    # ApiError, asyncHandler, validators, logger, viewHelpers
├── views/
│   ├── layouts/              # auth.ejs, app.ejs
│   ├── partials/             # head, brand, sidebar, navbar, user-menu, flash-message,
│   │                         # footer, page-header, card, empty-state, form-field,
│   │                         # form-password, foundation-checklist, planned-modules
│   ├── auth/                 # login, register, forgot-password, verify-otp, reset-password
│   ├── dashboard/            # index.ejs
│   ├── products/             # index.ejs
│   ├── warehouses/           # index.ejs
│   ├── operations/           # receipts, deliveries, transfers, adjustments, move-history
│   ├── settings/             # index.ejs
│   └── errors/               # 404.ejs, 429.ejs, 500.ejs
├── public/
│   ├── css/                  # variables, base, components, layout, auth, dashboard
│   ├── js/                   # common.js, auth.js
│   └── images/               # stocksense-mark.svg
├── scripts/                  # dbSync.js
├── docs/                     # architecture, api, design-system, roadmap
├── app.js                    # Express app + entry point
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
└── README.md
```

`app.js` is the single entry point: it builds the Express application and, when run directly with
`node app.js`, verifies the database connection and starts the HTTP server. When it is required as
a module (for tests or tooling) it only exports the app and does not listen.

---

## 4. Prerequisites

- **Node.js 20.19+** (developed on Node 24) — check with `node -v`
- **npm 10+** — check with `npm -v`
- **MySQL 8.0+** running locally, or a reachable MySQL server

---

## 5. MySQL database setup

Log in as an administrator and run:

```sql
CREATE DATABASE stocksense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stocksense_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON stocksense.* TO 'stocksense_user'@'localhost';
FLUSH PRIVILEGES;
```

Or with Docker (start Docker Desktop first):

```bash
docker run -d --name stocksense-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=stocksense \
  -e MYSQL_USER=stocksense_user \
  -e MYSQL_PASSWORD=your-strong-password \
  -p 3306:3306 mysql:8
```

Then create the `users` table:

```bash
npm run db:sync
```

This runs `sequelize.sync()` against the configured database. The server also verifies the
connection on startup and exits with a clear message if MySQL is unreachable.

---

## 6. Environment variable configuration

Copy the example file and edit it. **Never commit the real `.env`** (it is gitignored).

```bash
# macOS / Linux
cp .env.example .env

# Windows CMD
copy .env.example .env
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `NODE_ENV` | No | `development` | Runtime mode |
| `PORT` | No | `5000` | HTTP port |
| `APP_NAME` | No | `StockSense` | Name shown in the interface |
| `APP_VERSION` | No | `1.0.0` | Version shown in the footer |
| `CLIENT_URL` | No | `http://localhost:5173` | Legacy origin used to seed the CORS list |
| `CORS_ORIGINS` | No | value of `CLIENT_URL` | Comma-separated allowed origins |
| `JWT_SECRET` | **Yes in production** | — | JWT signing secret (min 32 chars in production) |
| `JWT_EXPIRES_IN` | No | `2h` | Token lifetime |
| `JWT_ISSUER` | No | `stocksense-api` | Token issuer claim |
| `COOKIE_NAME` | No | `ss_access_token` | Auth cookie name |
| `COOKIE_SECURE` | No | `true` in production | Send the cookie only over HTTPS |
| `COOKIE_SAME_SITE` | No | `lax` | Cookie `SameSite` policy |
| `DB_HOST` | **Yes in production** | `127.0.0.1` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_NAME` | **Yes in production** | `stocksense` | Database name |
| `DB_USER` | **Yes in production** | `root` | Database user |
| `DB_PASSWORD` | Recommended | — | Database password |
| `DB_LOG_SQL` | No | `false` | Log generated SQL |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | No | — | Outbound SMTP, required by the OTP flow |
| `OTP_EXPIRY_MINUTES` | No | `10` | OTP validity window |
| `OTP_MAX_ATTEMPTS` | No | `5` | OTP attempt limit |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

There is no client-side environment file: no secret and no `VITE_*` variable reaches the browser.

---

## 7. Installation

```bash
npm install
```

---

## 8. Commands

| Command | Description |
| ------- | ----------- |
| `npm start` | Start the app (`node app.js`) |
| `npm run dev` | Start the app with Nodemon (auto-reload) |
| `npm run db:sync` | Create/update tables from the Sequelize models |
| `npm run lint` | Lint the project |

```bash
npm start          # node app.js
npm run dev        # nodemon app.js
npm run db:sync    # sequelize.sync()
npm run lint       # eslint .
```

Default URLs:

- Application: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

---

## 9. Authentication and security

- Passwords are hashed with **bcrypt** (12 salt rounds) before storage.
- The `User` model uses a default scope that **excludes the `password` column**; it is only fetched
  explicitly through the `withPassword` scope during credential verification, so hashes never reach
  a view.
- On login the server signs a JWT and writes it to an **HttpOnly cookie** (`ss_access_token`). The
  token never appears in a response body and is never written to `localStorage` or `sessionStorage`.
- "Remember me" controls the cookie lifetime: a persistent 8-hour cookie, otherwise a session cookie.
- Every form carries a **double-submit CSRF token** (`middleware/csrf.js`). `verifyToken` runs before
  the routes, so a POST without a valid token is rejected with `403 CSRF_INVALID`.
- `requireAuth` resolves the cookie on every protected request and re-reads the user, so a
  deactivated account loses access immediately.
- Anonymous visitors are **redirected** to `/login` (browser requests never receive a JSON 401);
  the JSON envelope is reserved for `/api/*`, XHR and non-HTML clients.
- Duplicate email registration is rejected with `409`.
- Helmet security headers, a CORS origin allow-list, rate limiting and centralised error handling are
  all active. Error pages never expose stack traces in production.

**OTP password reset status:** the `/forgot-password`, `/verify-otp` and `/reset-password` routes,
controller, service and views exist and validate input, but the workflow is **not implemented**.
Until the `MAIL_*` variables are configured, the POST handlers return `503 OTP_NOT_CONFIGURED` with
an explanatory message. No OTP is ever faked or silently accepted.

---

## 10. Implemented features (Phase 1)

- Express + EJS MVC application with separated routes, controllers, services, models and middleware.
- MySQL + Sequelize configuration with environment-driven credentials and connection verification.
- `User` model: `id`, `fullName`, unique `email`, hashed `password`, `role` ENUM, `isActive` and
  timestamps, with a unique email index and a role index.
- Registration, login, logout and protected-route guards over HttpOnly JWT cookies.
- OTP route/service/view scaffolding with honest `503` responses while SMTP is unconfigured.
- Centralised error handling that serves both JSON envelopes and styled EJS error pages
  (404, 429, 500).
- Design system: CSS-variable palette, six button variants, form controls with inline validation,
  cards, badges, alerts, empty states and loaders.
- Auth UI: login, register, forgot password, OTP verification with resend countdown, reset password.
- Protected application shell: responsive off-canvas sidebar, top bar with profile dropdown,
  breadcrumbs, placeholder pages for every planned module and a 404 page.
- Vanilla JS for the sidebar, dropdown, password visibility, OTP entry and submit loading states —
  the app remains fully usable with JavaScript disabled.

## 11. Implemented features (Phase 2: Master Data)

- **Category Master Data**: Create, edit, search, active/inactive filtering, toggle status, and delete (restricted if products exist).
- **Product Master Data**: Complete catalogue with unique SKU normalization, category assignment, unit of measure, reorder levels, reorder quantities, search by name/SKU, category filtering, and status toggle.
- **Warehouse Master Data**: Facility registration with unique uppercase code normalization, address, description, active/inactive filtering, dynamic location count, and delete restriction if locations exist.
- **Location Master Data**: Storage zone/rack/bin management belonging to parent warehouses with scoped unique location codes, description, active/inactive filtering, and status toggle.
- Responsive server-rendered table UI with search toolbars, filter dropdowns, pagination, and empty states.

## 12. Implemented features (Phase 3: Inventory Engine & Stock Ledger)

- **`StockBalance` Single Source of Truth**: Tracks real-time quantities (`DECIMAL(15,3)`) per product and location, preventing negative balances and enforcing composite uniqueness `(product_id, location_id)`.
- **`StockMovement` Immutable Ledger**: Logs all stock fluctuations with `movementType` (`RECEIPT`, `DELIVERY`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`), before and after quantities, document references, reasons, and authenticated `performedBy` user auditing.
- **Atomic `inventoryService`**: Central engine wrapping stock increases, decreases, internal transfers, and physical cycle count adjustments in transactional updates (`LOCK.UPDATE`) to guarantee ledger consistency.
- **Stock Overview (`/inventory`)**: Displays live inventory balances, reorder level comparisons, and calculated stock status (`OUT OF STOCK`, `LOW STOCK`, `IN STOCK`).
- **Move History (`/move-history`)**: Comprehensive audit trail view with product, location, movement type, and search filters with pagination.
- *Note:* Operational transaction screens (Receipts, Deliveries, Transfers, Adjustments) are planned for Phase 4 to build directly on this inventory engine.


## 13. Implemented features (Phase 4: Inventory Operations)

- **Receipts** (`/operations/receipts`): multi-line supplier receipts with unique `REC-` numbers, draft creation with no stock effect, atomic validation through `inventoryService.increaseStock()`, `RECEIPT` ledger traceability, double-validation protection and safe cancellation.
- **Delivery Orders** (`/operations/deliveries`): multi-line customer deliveries with unique `DEL-` numbers, atomic validation through `inventoryService.decreaseStock()`, all-or-nothing shortage handling with no partial postings.
- **Internal Transfers** (`/operations/transfers`): source/destination warehouse + location documents with unique `TRF-` numbers, side-by-side create form, same-location prevention, atomic validation through `inventoryService.transferStock()` with paired ledger entries.
- **Inventory Adjustments** (`/operations/adjustments`): cycle-count documents with unique `ADJ-` numbers, server-read recorded quantities, physical counts, computed differences, validation through `inventoryService.adjustStock()` (`ADJUSTMENT_IN` / `ADJUSTMENT_OUT`, none when equal).

## 13. Planned for future phases (Phase 4+)

- Goods receipts (inbound) with supplier references and posting workflows.
- Delivery orders (outbound) with picking, packing, and dispatch confirmation.
- Internal transfers between warehouses with transfer documents.
- Inventory adjustments document workflows.
- Dashboard analytics built on real query data.
- OTP password reset once SMTP credentials are available, plus password change for signed-in users.
- Role-based permissions separating Inventory Manager and Warehouse Staff capabilities.
- Automated test suites and a CI pipeline.

## 12. Planned for future phases

- Goods receipts, delivery orders, internal transfers, inventory adjustments and move history.
- Multi-warehouse stock tracking and an immutable stock ledger.
- Dashboard analytics built on real query data.
- OTP password reset once SMTP credentials are available, plus password change for signed-in users.
- Role-based permissions separating Inventory Manager and Warehouse Staff capabilities.
- Automated test suites and a CI pipeline.

See [`docs/roadmap.md`](docs/roadmap.md) for the phase breakdown.

---

## 13. Documentation

- [`docs/architecture.md`](docs/architecture.md) — MVC layering, request flow, auth and CSRF design
- [`docs/api.md`](docs/api.md) — route reference, form contracts and status codes
- [`docs/design-system.md`](docs/design-system.md) — tokens, components and interaction rules
- [`docs/roadmap.md`](docs/roadmap.md) — what is delivered and what comes next
