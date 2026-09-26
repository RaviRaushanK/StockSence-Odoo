# API and routes reference

StockSense is a server-rendered MVC application. There is no JSON API for the web pages — forms
post normally and the server responds with a redirect or a rendered page. A small JSON surface
exists only where it is genuinely useful.

---

## 1. Health check (JSON)

### `GET /api/health`

The only JSON endpoint. It exists for monitoring and uptime checks and intentionally stays an API
route rather than an EJS page.

```json
{ "success": true, "message": "StockSense API is running.", "data": { "status": "ok" } }
```

Rate limited by the API limiter. The JSON envelope is only used for `/api/*`, XHR requests and
clients that do not accept HTML; browsers get the EJS error pages instead.

---

## 2. Page routes (HTML)

| Method | Path | Controller | View | Access |
| ------ | ---- | ---------- | ---- | ------ |
| GET | `/` | `pageController.home` | — (redirects to `/dashboard`) | Public |
| GET | `/login` | `authController.showLogin` | `auth/login` | Guests only |
| POST | `/login` | `authController.login` | — (redirect) | Public |
| GET | `/register` | `authController.showRegister` | `auth/register` | Guests only |
| POST | `/register` | `authController.register` | — (redirect) | Public |
| POST | `/logout` | `authController.logout` | — (redirect) | Signed in |
| GET | `/forgot-password` | `authController.showForgotPassword` | `auth/forgot-password` | Guests only |
| POST | `/forgot-password` | `authController.forgotPassword` | — (redirect) | Public |
| GET | `/verify-otp` | `authController.showVerifyOtp` | `auth/verify-otp` | Guests only |
| POST | `/verify-otp` | `authController.verifyOtp` | — (redirect) | Public |
| GET | `/reset-password` | `authController.showResetPassword` | `auth/reset-password` | Guests only |
| POST | `/reset-password` | `authController.resetPassword` | — (redirect) | Public |
| GET | `/dashboard` | `dashboardController.index` | `dashboard/index` | Protected |
| GET | `/categories` | `categoryController.list` | `categories/index` | Protected |
| GET | `/categories/create` | `categoryController.showCreate` | `categories/create` | Protected |
| POST | `/categories/create` | `categoryController.create` | — (redirect) | Protected |
| GET | `/categories/:id/edit` | `categoryController.showEdit` | `categories/edit` | Protected |
| POST | `/categories/:id/edit` | `categoryController.update` | — (redirect) | Protected |
| POST | `/categories/:id/toggle-status` | `categoryController.toggleStatus` | — (redirect) | Protected |
| POST | `/categories/:id/delete` | `categoryController.delete` | — (redirect) | Protected |
| GET | `/products` | `productController.list` | `products/index` | Protected |
| GET | `/products/create` | `productController.showCreate` | `products/create` | Protected |
| POST | `/products/create` | `productController.create` | — (redirect) | Protected |
| GET | `/products/:id/edit` | `productController.showEdit` | `products/edit` | Protected |
| POST | `/products/:id/edit` | `productController.update` | — (redirect) | Protected |
| POST | `/products/:id/toggle-status` | `productController.toggleStatus` | — (redirect) | Protected |
| POST | `/products/:id/delete` | `productController.delete` | — (redirect) | Protected |
| GET | `/warehouses` | `warehouseController.list` | `warehouses/index` | Protected |
| GET | `/warehouses/create` | `warehouseController.showCreate` | `warehouses/create` | Protected |
| POST | `/warehouses/create` | `warehouseController.create` | — (redirect) | Protected |
| GET | `/warehouses/:id/edit` | `warehouseController.showEdit` | `warehouses/edit` | Protected |
| POST | `/warehouses/:id/edit` | `warehouseController.update` | — (redirect) | Protected |
| POST | `/warehouses/:id/toggle-status` | `warehouseController.toggleStatus` | — (redirect) | Protected |
| POST | `/warehouses/:id/delete` | `warehouseController.delete` | — (redirect) | Protected |
| GET | `/warehouses/:warehouseId/locations` | `locationController.list` | `locations/index` | Protected |
| GET | `/warehouses/:warehouseId/locations/create` | `locationController.showCreate` | `locations/create` | Protected |
| POST | `/warehouses/:warehouseId/locations/create` | `locationController.create` | — (redirect) | Protected |
| GET | `/warehouses/:warehouseId/locations/:id/edit` | `locationController.showEdit` | `locations/edit` | Protected |
| POST | `/warehouses/:warehouseId/locations/:id/edit` | `locationController.update` | — (redirect) | Protected |
| POST | `/warehouses/:warehouseId/locations/:id/toggle-status` | `locationController.toggleStatus` | — (redirect) | Protected |
| POST | `/warehouses/:warehouseId/locations/:id/delete` | `locationController.delete` | — (redirect) | Protected |
| GET | `/inventory` | `inventoryController.stockOverview` | `inventory/index` | Protected |
| GET | `/receipts` | `dashboardController.receipts` | `operations/receipts` | Protected |
| GET | `/deliveries` | `dashboardController.deliveries` | `operations/deliveries` | Protected |
| GET | `/transfers` | `dashboardController.transfers` | `operations/transfers` | Protected |
| GET | `/adjustments` | `dashboardController.adjustments` | `operations/adjustments` | Protected |
| GET | `/move-history` | `inventoryController.moveHistory` | `operations/move-history` | Protected |
| GET | `/operations/deliveries` | `deliveryController.list` | `operations/deliveries/index` | Protected |
| GET | `/operations/deliveries/create` | `deliveryController.showCreate` | `operations/deliveries/create` | Protected |
| POST | `/operations/deliveries/create` | `deliveryController.create` | — (redirect) | Protected |
| GET | `/operations/deliveries/:id` | `deliveryController.show` | `operations/deliveries/show` | Protected |
| POST | `/operations/deliveries/:id/validate` | `deliveryController.validate` | — (redirect) | Protected |
| POST | `/operations/deliveries/:id/cancel` | `deliveryController.cancel` | — (redirect) | Protected |
| GET | `/operations/transfers` | `transferController.list` | `operations/transfers/index` | Protected |
| GET | `/operations/transfers/create` | `transferController.showCreate` | `operations/transfers/create` | Protected |
| POST | `/operations/transfers/create` | `transferController.create` | — (redirect) | Protected |
| GET | `/operations/transfers/:id` | `transferController.show` | `operations/transfers/show` | Protected |
| POST | `/operations/transfers/:id/validate` | `transferController.validate` | — (redirect) | Protected |
| POST | `/operations/transfers/:id/cancel` | `transferController.cancel` | — (redirect) | Protected |
| GET | `/operations/adjustments` | `adjustmentController.list` | `operations/adjustments/index` | Protected |
| GET | `/operations/adjustments/create` | `adjustmentController.showCreate` | `operations/adjustments/create` | Protected |
| POST | `/operations/adjustments/create` | `adjustmentController.create` | — (redirect) | Protected |
| GET | `/operations/adjustments/:id` | `adjustmentController.show` | `operations/adjustments/show` | Protected |
| POST | `/operations/adjustments/:id/validate` | `adjustmentController.validate` | — (redirect) | Protected |
| POST | `/operations/adjustments/:id/cancel` | `adjustmentController.cancel` | — (redirect) | Protected |
| GET | `/settings` | `dashboardController.settings` | `settings/index` | Protected |

| * | anything else | — | `errors/404` | Public |

"Guests only" means `redirectIfAuthenticated` sends an already signed-in visitor to `/dashboard`.
"Protected" means `requireAuth` sends an anonymous visitor to `/login` with a flash message.

---

## 3. Form fields

| Form | Fields | Validation |
| ---- | ------ | ---------- |
| Register | `fullName`, `email`, `password`, optional `role` | 2–120 chars · valid email · ≥8 chars with a letter and a number · role must be `INVENTORY_MANAGER` or `WAREHOUSE_STAFF` |
| Login | `email`, `password`, optional `rememberMe` | Valid email · non-empty password |
| Forgot password | `email` | Valid email |
| Verify OTP | `email`, `otp` | Valid email · exactly 6 digits |
| Reset password | `email`, `otp`, `password` | Valid email · 6 digits · strong password |

Every form also carries a hidden `_csrf` field. `middleware/csrf.js` compares it against the signed
`ss_csrf` cookie and rejects the request with `403 CSRF_INVALID` when they do not match.

### Successful redirects

| Action | Result |
| ------ | ------ |
| Register | `302 → /login` with a success flash |
| Login | `302 → /dashboard` with a success flash (or `?next=` when present) |
| Logout | `302 → /login` with a success flash |
| Forgot password | `302 → /verify-otp?email=…` with a success flash |
| Verify OTP | `302 → /reset-password?email=…&otp=…` |
| Reset password | `302 → /login` with a success flash |

### Failure behaviour

| Status | Code | User experience |
| ------ | ---- | ---------------- |
| 422 | `VALIDATION_ERROR` | The same form re-renders with per-field error messages |
| 401 | `UNAUTHORIZED` | Flash message, redirect back to the form with the email preserved |
| 403 | `FORBIDDEN` | Flash message (deactivated account) or the 403 page (CSRF failure) |
| 409 | `EMAIL_ALREADY_REGISTERED` | Flash message, redirect back to `/register` |
| 429 | `RATE_LIMITED` | The 429 page with a retry hint |
| 503 | `DATABASE_UNAVAILABLE` | The 500 page |
| 503 | `OTP_NOT_CONFIGURED` | Flash message explaining that SMTP is not configured |

---

## 4. Authentication endpoints status

The OTP password reset workflow is **scaffolded, not implemented**. The routes, the controller, the
service and the views all exist and the input is validated, but no OTP is ever generated, stored,
emailed or accepted. Until the `MAIL_*` variables are configured, all three POST handlers return
`503 OTP_NOT_CONFIGURED` with an explanatory message, and the interface states this plainly. No
code path reports a false success.

---

## 5. Rate limits

| Scope | Window | Limit (development) | Limit (production) |
| ----- | ------ | ------------------- | ------------------ |
| `/api/health` | 15 min | 1000 requests | 300 requests |
| Auth POST routes | 15 min | 100 requests | 20 requests |

Exceeding a limit returns **429** with `code: "RATE_LIMITED"` (JSON for API clients, the 429 page
for browsers).

---

## 6. Status codes used

`200` OK · `302` Redirect · `400` Bad request · `401` Unauthenticated · `403` Forbidden ·
`404` Not found · `409` Conflict · `422` Validation error · `429` Too many requests ·
`500` Server error · `503` Service unavailable
