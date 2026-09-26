# Design system

Every visual value is defined once as a CSS custom property in `public/css/variables.css`.
Templates and partials reference the classes, never literal colours.

## File layout

| File | Contents |
| ---- | -------- |
| `public/css/variables.css` | Design tokens: colours, typography, spacing, radii, shadows, z-index, layout metrics. |
| `public/css/base.css` | Element defaults, focus ring, utility helpers. |
| `public/css/components.css` | Buttons, form controls, alerts, cards, badges, empty states, modals, loaders, toasts. |
| `public/css/layout.css` | Brand, app shell, sidebar, top bar, dropdown, page header, breadcrumbs, footer. |
| `public/css/auth.css` | Auth split layout, OTP inputs, password rules. |
| `public/css/dashboard.css` | Page-level styles: module grid and the standalone error pages. |

`partials/head.ejs` links them in that order, after Bootstrap and Bootstrap Icons, so the design
system always wins. Both vendor packages are served straight from `node_modules` under
`/vendor/bootstrap` and `/vendor/bootstrap-icons`; no vendored copies are committed.

## Colour palette

| Token | Value | Purpose |
| ----- | ----- | ------- |
| `--ss-primary` | `#2563EB` | Primary actions, active nav, links |
| `--ss-primary-hover` | `#1D4ED8` | Primary hover state |
| `--ss-primary-active` | `#1E40AF` | Primary pressed state |
| `--ss-primary-soft` | `#EFF6FF` | Tinted backgrounds |
| `--ss-primary-border` | `#BFDBFE` | Soft borders |
| `--ss-sidebar` | `#0F172A` | Sidebar and dark brand panel |
| `--ss-sidebar-hover` | `#1E293B` | Sidebar hover |
| `--ss-sidebar-active` | `#1D4ED8` | Active sidebar item |
| `--ss-bg` | `#F8FAFC` | Main page background |
| `--ss-card` | `#FFFFFF` | Card and input background |
| `--ss-text` | `#0F172A` | Primary text |
| `--ss-text-secondary` | `#64748B` | Secondary text, hints |
| `--ss-border` | `#E2E8F0` | Borders and dividers |
| `--ss-border-strong` | `#CBD5E1` | Input borders |
| `--ss-success` | `#16A34A` | Success actions |
| `--ss-warning` | `#F59E0B` | Warning states |
| `--ss-danger` | `#DC2626` | Destructive actions and errors |
| `--ss-info` | `#0EA5E9` | Informational states |

Soft tints (`--ss-*-soft`) back alerts and badges so text stays readable at small sizes.

## Typography

- Font stack: `'Inter'` first, then the system sans-serif stack
  (`-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `Arial`, …). Inter is used when
  available locally; no external font CDN is required, so the app works offline.
- Scale: `--ss-text-xs` 0.75rem · `--ss-text-sm` 0.875rem · `--ss-text-base` 1rem ·
  `--ss-text-lg` 1.125rem · `--ss-text-xl` 1.375rem · `--ss-text-2xl` 1.75rem.
- Body line height 1.6; headings 1.3 with 600 weight; page titles 700 with slight negative tracking.
- Spacing scale: `--ss-space-1` (0.25rem) through `--ss-space-7` (3rem).

## Buttons

Markup is written directly in the templates, so the classes are part of the contract:

```html
<button class="ss-btn ss-btn--primary ss-btn--md" type="submit">Sign in</button>
```

| Variant | Class | Appearance |
| ------- | ----- | ---------- |
| Primary | `ss-btn--primary` | Solid `--ss-primary`; the single main action on a screen. |
| Secondary | `ss-btn--secondary` | Neutral surface with a border; supporting actions. |
| Outline | `ss-btn--outline` | Transparent with a primary border; tertiary actions. |
| Success | `ss-btn--success` | Solid green; confirmations. |
| Danger | `ss-btn--danger` | Solid red; destructive actions such as sign out or delete. |
| Icon | `ss-btn--icon` | Square, icon-only; requires an `aria-label`. |

Sizes: `ss-btn--sm` (36px), `ss-btn--md` (42px, default), `ss-btn--lg` (48px). Add `ss-btn--block`
for full-width form submissions. Every button has a 6px radius, a 160ms hover transition, a 3px focus
ring for keyboard users, and a 60%-opacity disabled state. Icons come exclusively from Bootstrap
Icons (`bi-*`); no second icon library is used.

## Forms

`partials/form-field.ejs` and `partials/form-password.ejs` render a label, the control, an optional
leading icon, an optional action button and the inline error in one consistent block.

- All inputs are 42px tall (36px `ss-input--sm`, 48px `ss-input--lg`) with a 6px radius.
- Focus produces a primary border plus a soft blue ring; `ss-input--error` switches to red.
- Errors use `role="alert"`, are wired through `aria-describedby`, and set `aria-invalid="true"`.
- `form-password.ejs` adds a show/hide button with `aria-pressed`.
- The server renders the same markup whether or not JavaScript is available, so inline validation
  survives a full page reload after a failed submit.
- Checkboxes use `.ss-checkbox`; the six-box OTP input uses `.ss-otp` and is driven by `auth.js`
  (auto-advance, arrow keys, paste, and a hidden field that stays in sync for the server).

## Cards, badges, empty states, loaders

- `partials/card.ejs` — white surface, 1px `--ss-border`, 10px radius, minimal shadow, with
  optional title, subtitle and footer.
- `.ss-badge` with `--neutral`, `--success`, `--warning`, `--danger`, `--info` or `--primary` tone.
- `partials/empty-state.ejs` — icon, title and explanation, used wherever data is not yet available
  so no fabricated figures appear.
- `.ss-loader` with `--full` for route transitions and `--overlay` for blocking work.
- `.ss-alert` with `info`, `success`, `warning` and `danger` tones, also used by the flash partial.
- `.ss-error` renders the standalone 404, 429 and 500 pages with the same tokens.

## Layout shell

- Sidebar: 264px, dark (`--ss-sidebar`), grouped navigation with section labels, the active item
  highlighted in `--ss-sidebar-active` and marked with `aria-current="page"`.
- Top bar: 64px, white, sticky, with the mobile menu toggle and the profile dropdown.
- Responsive: below 992px the sidebar is off-canvas with a backdrop and closes on navigation or
  Escape; at 992px and above it is permanently visible and the content area is offset.
- Content area: max width 1280px, centred, 24px padding (16px on small screens).

## Interaction principles

1. Motion is subtle: 140–220ms transitions, no decorative animation, and
   `prefers-reduced-motion` disables the spinner and button transitions.
2. Every interactive element has a visible keyboard focus indicator.
3. Every form shows a loading state on submit and reports the outcome through the flash partial.
4. Empty states explain *why* the screen is empty and what will appear there later.
5. Colour is never the only signal — text and icons accompany every state.
6. The UI is server-rendered and fully usable without JavaScript; scripts only enhance it.
