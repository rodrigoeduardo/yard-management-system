# Business Rules

<!-- The source of truth for behavior. Reviewers check PRs against this file.
     Write rules so they are objectively checkable: given input/state -> expected outcome.
     Use stable headings — issues reference them as anchors
     (e.g. docs/specs/business-rules.md#rule-name). -->

## UI language (`setup`)

- The UI defaults to Portuguese but is served through an en/pt-br toggle — see the [UI language note](glossary.md#ui-language-note) for the detection mechanism and current migration status.

## Weight display

- All weight values are displayed with the unit label **"Ton"** (tonnes) everywhere in the UI. This is a display re-label only — no numeric conversion is applied to stored values.

## Materials (`load-intake`, `inventory-view`)

- **Material** is a persisted entity with a single property, **name** (unique).
- The load form selects an existing material or stages a new one; a staged new material is persisted only when the load is submitted (same transaction as the load).
- A **Materials** page lists every material with the count of its `in_stock` items, and allows adding or editing materials inline on that page.

## Add Load (`load-intake`)

- Creates a `load` object with: **Nota Fiscal (NF)**, **Entry Date**, **NF Weight**, **Material**, **Item Count**.
- From Item Count, the form generates N fields for each item's individual weight (typically 15–18 items, recommended maximum 20).
- All other parameters (NF, entry date, material) are shared by every item in the load; only weight varies per item.
- The sum of individual item weights produces the load's **Remaining Weight**. It does **not** need to match the NF Weight.
- On completion, generate one QR code per item containing: an identifier (e.g. "Item 1 - <NF>"), the material, and the item's weight.
- QR codes are printed one per label, sized for the Elgin L42 Pro Full label printer (100×50 mm labels) — not laid out in a batch on a single page.

## Load Removal (`load-removal`)

- A removal action starts with manual input of **Exit Date**, **Driver**, and **Vehicle Plate** ("Placa do veículo") — fixed for every item removed in that action. Vehicle Plate is required.
- The operator attaches the customer's **Pedido** as a single reference image (a photo/screenshot of the requested materials and weights) — **required**, one image per removal, replaceable before submit. It is a plain attached image: no structured rows, no OCR/parsing, and no comparison of scanned weight against a target. The New Removal form previews the attached image alongside the running list of scanned items and their weights (zoomable/expandable), so the operator can eyeball the two side by side while scanning.
- Scanning an item's QR code adds the item to the removal.
- Removing an item:
  - decrements the corresponding load's **Item Count**, and
  - subtracts the item's weight from that load's **Remaining Weight**.
- A single removal action may scan items from **different loads** (different NFs).
- On completion, compute **Total Removed Weight** = sum of the weights of all items removed in the action.
- The Pedido image is uploaded to Supabase Storage on removal submit; the removal record stores only the storage object path, never the image bytes. An upload failure blocks submit but preserves the rest of the removal input (exit date, driver, vehicle plate, scanned items) so the operator can retry without re-entering anything.
- Each removal has a printable/shareable **comprovante de remoção** (receipt), reachable from the removal detail modal on the Estoque page (`/removals/<id>/receipt`). It shows: Exit Date + time, Driver, Vehicle Plate, Total Removed Weight; the attached Pedido reference image (always present — required at removal time, see above); and a removed-items table (item number, NF, material, weight). No client fields — the client entity was removed (#264–#268). PT-BR text throughout; printable via the browser's print dialog.

## Registration (`auth`)

- Applies only when `DEMO_MODE` is not set — see [Demo Mode](#demo-mode) below for the flag-enabled deployment.
- Signup is closed to outsiders: `/register` requires a shared invite code (env var `REGISTER_INVITE_CODE`), checked with a constant-time comparison. A wrong or missing code shows a Portuguese error and creates no account.
- There is no admin UI or approval queue — access is granted or revoked by rotating the invite code(s) (see roles below).
- On a valid code, the account is created with `user_metadata.display_name` set from the name field. If email confirmation is enabled on the Supabase project, the user sees a confirmation notice instead of landing directly in the app.

### Roles: operator and viewer (`auth`)

- Two roles exist: **operator** (default, full read/write) and **viewer** (read-only).
- A second, optional invite code — env var `VIEWER_INVITE_CODE` — registers a viewer account instead of an operator. It is checked the same way as `REGISTER_INVITE_CODE` (a second valid code at `/register`, constant-time comparison).
- When `VIEWER_INVITE_CODE` is unset, the viewer path does not exist: only the operator code is accepted, and behavior is identical to a deployment with no viewer role at all. This is the kill switch — access is revoked deployment-wide by unsetting it.
- Registering with the viewer code sets `user_metadata.app_role = "viewer"`. Registering with the operator code leaves `app_role` unset — absent `app_role` means operator, so every pre-existing account (created before this role existed) is unaffected and stays an operator.
- Every server action in `lib/actions/` that writes refuses to run for a viewer session, returning a Portuguese error before any database access — see `lib/actions/guard.ts`. Read paths (the inventory view, materials list, removal receipts, etc.) are unaffected: a viewer can read the whole app.
- Access is granted or revoked per role by rotating the corresponding code: rotate `REGISTER_INVITE_CODE` to control new operator signups, rotate (or unset) `VIEWER_INVITE_CODE` to control new viewer signups. Rotating a code has no effect on accounts already created — there is no way to change an existing account's role short of direct database access (out of scope for this app).
- Database-level (RLS) enforcement of the viewer role is a separate concern: the app connects directly to Postgres, so existing RLS policies do not constrain it. The guard in `lib/actions/` is the only enforcement point today.

## Demo Mode (`auth`, `demo`)

- Enabled by the `DEMO_MODE` env flag (off by default; see [ADR 0002](../adr/0002-demo-mode-flag.md)). All auth code stays intact — demo mode only changes how a session is established, not the auth mechanism itself.
- Every visitor is transparently auto-logged in as a single seeded demo user, with credentials read from env — no login form is shown.
- `/login` and `/register` both redirect straight into the app; there is no self-service signup while `DEMO_MODE` is set.
- A persistent banner is shown on every page, in Portuguese, stating: this is a demonstration environment, data is shared with other visitors, the dataset resets nightly, and a CTA link (env-configured) back to the landing page / contact.
- The dataset resets nightly: a scheduled job truncates the demo data (loads, items, removals, removal items, materials, and the audit log) and reseeds it with realistic PT-BR sample data (see [ADR 0003](../adr/0003-nightly-demo-reset.md)). The seed script is idempotent and doubles as local dev seed data.

## Inventory View (`inventory-view`)

- **Table 1 — current stock**: loads ordered by last modification (most recent on top). Columns: NF, Entry Date, NF Weight, Material (fixed) + Item Count, Remaining Weight (variable). Row/card colour follows a three-tier removal-progress rule, no badge in any tier: **green** when no items have been removed yet (`removedItemCount === 0`); **yellow** when some items are removed but the load is not finished; **red** when the load is finished (Item Count and Remaining Weight both zero). A load whose removals were all cancelled goes back to `removedItemCount === 0` and renders green again. Colour is derived per row and is never a sort key; Item Count and Remaining Weight are always also shown as text.
- **Table 2 — removal log**: removals ordered by last modification (most recent on top). Columns: Exit Date, Driver, Vehicle Plate, Total Removed Weight, NFs involved in the removal.
- Both tables are read-only.
- **Dashboard**: shows the count of unique materials currently in stock as "Materiais no Pátio", linking to the Materials page; "Cargas Ativas" links to the Estoque (inventory) page.
