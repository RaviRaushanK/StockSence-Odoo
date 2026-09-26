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

## Delivered — Phase 3: Inventory Engine & Stock Ledger

- **`StockBalance` model**: Tracks current physical quantities (`DECIMAL(15,3)`) per product and location with composite uniqueness `(product_id, location_id)` and non-negative constraints.
- **`StockMovement` audit ledger model**: Records every stock-changing event with `movementType` (`RECEIPT`, `DELIVERY`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`), quantity before/after, reference type/ID, reason, and authenticated `performedBy` user.
- **`inventoryService`**: Centralized, atomic mutation layer using Sequelize transactions and row locks. Reusable by upcoming transaction modules.
- **Stock increases**: Atomically increments stock balances and creates ledger entries (`RECEIPT`, `TRANSFER_IN`, `ADJUSTMENT_IN`).
- **Stock decreases**: Rejects negative balances with `INSUFFICIENT_STOCK` and commits decrements with audit trail.
- **Internal transfers**: Transfers quantities atomically between source and destination locations within a single transaction, generating paired `TRANSFER_OUT` and `TRANSFER_IN` ledger movements.
- **Inventory adjustments**: Compares recorded physical counts and establishes exact delta adjustments (`ADJUSTMENT_IN` / `ADJUSTMENT_OUT`).
- **Stock Overview page (`/inventory`)**: Real database overview displaying current quantities, product reorder thresholds, and dynamic stock status badges (`OUT_OF_STOCK`, `LOW_STOCK`, `IN_STOCK`).
- **Move History page (`/move-history`)**: Read-only searchable and filterable ledger with pagination, product/type filters, and traceability.
- **Transaction modules deferred to next phase**: Goods Receipts, Delivery Orders, Internal Transfers, and Inventory Adjustments transaction workflows/document models will build on this engine in Phase 4.

## Phase 4 — Transaction Modules & Operations
- **Transaction rollback and reversal policy**: insufficient delivery/transfer stock fails the whole document with no partial balances or movements; `DONE` documents have no silent reversal.


## Delivered — Phase 4: Inventory Operations

- **Document models**: `Receipt`/`ReceiptItem`, `Delivery`/`DeliveryItem`, `InternalTransfer`/`TransferItem`, `InventoryAdjustment`/`AdjustmentItem` with unique numbers (`REC-`, `DEL-`, `TRF-`, `ADJ-`), `DRAFT → READY/WAITING → DONE` plus `CANCELED`, creator/validator audit fields and `RESTRICT` deletes for history.
- **Operation services** (`receiptService`, `deliveryService`, `transferService`, `adjustmentService`): validate supplier/customer/reason, active products, active warehouses, active locations, warehouse/location ownership, positive quantities, duplicate lines and at-least-one-item. No stock math lives outside `inventoryService`.
- **Validation transactions**: each validate locks the document and items (`LOCK.UPDATE`), revalidates state/products/locations, applies `increaseStock` / `decreaseStock` / `transferStock` / `adjustStock` with `referenceType` (`RECEIPT`, `DELIVERY`, `TRANSFER`, `ADJUSTMENT`) and `referenceId` (document id), then marks `DONE` with validator/timestamp. Any failure rolls back atomically.
- **Idempotency and immutability**: `DONE` documents reject re-validation and cancellation; only non-`DONE` documents can be canceled with no stock effect. Show pages render `DONE` as read-only with a Move History trace.
- **EJS operations UI** under `/operations/...` for receipts, deliveries, transfers and adjustments: searchable/filterable index, multi-line create forms with warehouse→location loading and add/remove rows, and detail pages with validate/cancel actions behind auth + CSRF.


- Goods receipts (inbound) with supplier references, order lines, and posting.
- Outbound delivery orders with picking, packing, and dispatch confirmation.
- Internal transfer requests and approval workflows.
- Physical cycle count / inventory adjustment management screens.


## Phase 4 — Security and operations

- OTP password reset once SMTP credentials are configured, including a persisted OTP store with
  expiry, attempt limits and resend throttling.
- Change password and profile management for signed-in users.
- Refresh-token rotation and session revocation.
- Automated unit and integration tests, plus a CI pipeline.
- Enable Helmet's Content Security Policy once the markup no longer relies on the current
  inline-rendering pattern.
