# Roadmap

## Delivered — Phase 1: project foundation (MVC)

**Scope:** foundation only. The inventory domain is deliberately not implemented.

- Express 5 + EJS application with an explicit MVC layering
  (routes → controllers → services → Sequelize models → MySQL).
- MySQL + Sequelize configuration with environment-driven credentials, connection verification at
  startup and a `db:sync` script.
- `User` model with hashed passwords, role ENUM, active flag, indexes and a password-excluding
  default scope.
- Working registration, login, logout and session guards. JWT delivered in an HttpOnly cookie, with
  a double-submit CSRF token on every form.
- OTP route, controller, service and view scaffolding that reports an honest `503` while SMTP is
  unconfigured.
- Complete design system expressed as EJS partials and six CSS files, served with Bootstrap 5 and
  Bootstrap Icons from `node_modules`.
- Login, register, forgot password, OTP verification and reset password screens with full
  server-side validation.
- Protected application shell: responsive off-canvas sidebar, top bar with profile dropdown,
  breadcrumbs, placeholder pages for every planned module, and 404/429/500 pages.
- Vanilla JS for sidebar, dropdown, password toggle, OTP entry and submit loading states only.

## Delivered — Phase 2: Product and warehouse master data

- `Product`, `Category`, `Warehouse` and `Location` Sequelize models with associations and foreign key constraints.
- Category CRUD, active/inactive toggles, search, and delete protection against products attached.
- Product CRUD with SKU uppercase normalization, category assignment, unit of measure, reorder thresholds, search, category filter, and status filter.
- Warehouse CRUD with unique uppercase code normalization, location counts, active/inactive toggles, and delete protection against locations attached.
- Location CRUD scoped to parent warehouses with unique location codes within warehouse.
- Server-rendered responsive data tables with pagination, toolbars, and empty states.
- Double-submit CSRF protection on all state-changing forms and toggles.

## Phase 3 — Stock movements

- Goods receipts (inbound) with supplier references and posting.
- Delivery orders (outbound) with picking, packing and dispatch.
- Internal transfers between warehouses with in-transit tracking.
- Inventory adjustments with mandatory reason codes and an audit trail.
- Immutable stock ledger and the searchable move history screen.

- Goods receipts (inbound) with supplier references and posting.
- Delivery orders (outbound) with picking, packing and dispatch.
- Internal transfers between warehouses with in-transit tracking.
- Inventory adjustments with mandatory reason codes and an audit trail.
- Immutable stock ledger and the searchable move history screen.

## Phase 4 — Security and operations

- OTP password reset once SMTP credentials are configured, including a persisted OTP store with
  expiry, attempt limits and resend throttling.
- Change password and profile management for signed-in users.
- Refresh-token rotation and session revocation.
- Automated unit and integration tests, plus a CI pipeline.
- Enable Helmet's Content Security Policy once the markup no longer relies on the current
  inline-rendering pattern.
