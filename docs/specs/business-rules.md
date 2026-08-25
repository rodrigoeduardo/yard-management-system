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
- Each material row also shows the summed weight of its `in_stock` items (removed items excluded), rendered through the [weight display](#weight-display) format, e.g. `10 und. · 10.000 Ton em estoque`. A material with no in-stock items shows a zero weight, not a blank.

## Add Load (`load-intake`)

- Creates a `load` object with: **Nota Fiscal (NF)**, **Ordem de Transporte**, **Motorista** (inbound driver — distinct from the removal's Motorista), **NF Date**, **Entry Date**, **NF Weight**, **Material**, **Item Count**. Ordem de Transporte and Motorista are required at intake; loads created before this field existed keep them `NULL` and display `—`.
- **NF Date** (the calendar date printed on the invoice) and **Entry Date** (when the truck physically arrived at the yard) are two distinct facts, both required at intake. NF Date has no time component and is never timezone-shifted; Entry Date is a timestamp shown in the yard's local timezone (see `lib/loads/entry-datetime.ts`). Loads created before NF Date existed as its own field have it backfilled from Entry Date's calendar day.
- From Item Count, the form generates N fields for each item's individual weight (typically 15–18 items, recommended maximum 20).
- All other parameters (NF, NF date, entry date, material) are shared by every item in the load; only weight and **Corrida** vary per item.
- Each item also carries a **Corrida** (heat/batch identifier), entered alongside its weight; both are required before the load can be submitted. Items created before this field existed keep `corrida` `NULL` — the label and QR payload degrade cleanly for them (no empty Corrida line). Corrida is descriptive only: it does not participate in scan/removal matching, and is out of scope for the stock table and removal receipt.
- The sum of individual item weights produces the load's **Remaining Weight**. It does **not** need to match the NF Weight.
- On completion, generate one QR code per item containing: an identifier (e.g. "Item 1 - <NF>"), the material, the item's weight, and its Corrida (when present).
- QR codes are printed one per label, sized for the Elgin L42 Pro Full label printer (100×50 mm labels) — not laid out in a batch on a single page. The label shows identifier, material, weight, then Corrida (when present), in that order.
- Each item is assigned a **number** `1..N` at intake, in the same order as the form's weight/Corrida fields — item 1 is the first field, item N the last. This number is what "Item <n>" in the identifier and QR payload refers to. It is immutable for the life of the item: it is persisted at intake and never recomputed from a later read, so marking an item removed, cancelling that removal, or correcting an item's weight never changes any item's number — including the numbers of every other item still in the load. Reprinting a load's labels always reproduces the same identifiers as the labels already glued to the material (#336).

## Corrections (`inventory-view`)

- With `FEATURE_ITEM_WEIGHT_EDIT` enabled, an operator may correct only an in-stock item's weight. The load's Remaining Weight is recomputed as the exact sum of its in-stock item weights; Item Count does not change.
- Removed items and every removal's recorded total remain immutable. A correction does not issue a new QR token, identifier, or label; existing printed labels remain stale, and a later reprint uses the corrected weight.
- With `FEATURE_LOAD_EDIT` enabled (default off — #352), an operator may correct a load's own fields from an "Editar carga" flow on the Estoque load-detail modal:
  - **Ordem de Transporte**, **Motorista**, **Data da Nota Fiscal**, **Data de Entrada**, and **Peso da Nota Fiscal** are always editable, for any load.
  - **Nota Fiscal** and **Material** are editable only while the load has **no removed items** (`removedItemCount === 0`). Once any item of the load has been removed, both fields render read-only in the edit form with a PT-BR explanation, and the server action rejects an attempt to change either — checked against committed database state inside the same locked transaction, not trusted from the client. Every other field stays editable regardless of removals.
  - **Item Count** and **Peso Restante** are never accepted as input by this action; they stay derived exactly as before. Editing a load never changes any item's `number`, `qrToken`, `weight`, `corrida`, or `status`, nor any removal's recorded `totalRemovedWeight`.
  - Validation mirrors Add Load: NF / Ordem de Transporte / Motorista non-empty, NF Weight positive, NF Date a valid calendar date, Entry Date a valid date-time — same PT-BR messages. Material accepts an existing material or a new name, resolved the same way as intake.
  - Changing Material moves the load's in-stock items between the counts/weights shown on the Materials page — intended, not a bug. `updatedAt` moves on every successful edit, so the load rises to the top of the stock table (ordered by last modification).
  - After a successful save, the UI warns that this load's printed labels are now stale and must be reprinted whenever **NF or Material** changed — those two are what appears on the label/QR payload. Reprinting itself stays the operator's existing manual flow; this action never triggers it automatically.
  - Out of scope: adding/deleting items (Item Count stays fixed), editing an item's weight or corrida (separate flags/issues), and editing a removal's own fields.

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
- Each removal has a printable/shareable **comprovante de remoção** (receipt), reachable from the removal detail modal on the Estoque page (`/removals/<id>/receipt`). It shows: Exit Date + time, Driver, Vehicle Plate, Total Removed Weight; the attached Pedido reference image (always present — required at removal time, see above); and a table summarizing the removed items **one row per (NF, Material) pair** — columns NF, Material, Qtd. de itens, Peso total — instead of one row per item, to keep large removals from running to pages. Each row's weight is the exact sum of that group's item weights; the sum of all row weights equals the removal's Total Removed Weight exactly. The removal detail modal still lists individual items — only the printable receipt is summarized. No client fields — the client entity was removed (#264–#268). PT-BR text throughout; printable via the browser's print dialog.
- **Cancelling a removal** (behind `FEATURE_REMOVAL_CANCEL`, default off — #310): an operator can reverse a removal exactly, e.g. when the wrong items were scanned or the customer's order was cancelled after the truck left. Cancellation, in one transaction:
  - stamps the removal with `cancelled_at`/`cancelled_by`;
  - sets every item of that removal back to `in_stock`; and
  - credits each affected load's Item Count and Remaining Weight back by that removal's own contribution (a removal spanning multiple loads credits each load only its own items).
  - Cancelling an already-cancelled removal is rejected — no double credit.
  - The removal record itself is never deleted: it stays in the Histórico de Remoções, visibly marked **Cancelada**, and its receipt remains reachable — the paper trail is preserved. A cancelled removal is excluded from read paths that treat "removed" as gone (e.g. the home dashboard's last-movement card).
  - Re-removing one of the returned items afterwards works normally, as a new removal.
  - Out of scope: partially cancelling a removal (individual items), editing a removal's driver/plate/date, and marking the cancellation on the receipt itself.

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
