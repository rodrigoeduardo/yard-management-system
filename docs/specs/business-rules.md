# Business Rules

Source of truth for application behavior. Translated and expanded from the original project proposal (original Portuguese version preserved in git history: first commit's `CLAUDE.md`).

## Weight display

- All weight values are displayed with the unit label **"t"** (tonnes) everywhere in the UI. This is a display re-label only — no numeric conversion is applied to stored values.

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
- Scanning an item's QR code adds the item to the removal.
- Removing an item:
  - decrements the corresponding load's **Item Count**, and
  - subtracts the item's weight from that load's **Remaining Weight**.
- A single removal action may scan items from **different loads** (different NFs).
- On completion, compute **Total Removed Weight** = sum of the weights of all items removed in the action.

## Registration (`auth`)

- Signup is closed to outsiders: `/register` requires a shared invite code (env var `REGISTER_INVITE_CODE`), checked with a constant-time comparison. A wrong or missing code shows a Portuguese error and creates no account.
- There is no admin UI or approval queue — access is granted or revoked by rotating the invite code.
- On a valid code, the account is created with `user_metadata.display_name` set from the name field. If email confirmation is enabled on the Supabase project, the user sees a confirmation notice instead of landing directly in the app.

## Inventory View (`inventory-view`)

- **Table 1 — current stock**: loads ordered by last modification (most recent on top). Columns: NF, Entry Date, NF Weight, Material (fixed) + Item Count, Remaining Weight (variable). When both Item Count and Remaining Weight reach zero, display the row in green (load finished).
- **Table 2 — removal log**: removals ordered by last modification (most recent on top). Columns: Exit Date, Driver, Vehicle Plate, Total Removed Weight, NFs involved in the removal.
- Both tables are read-only.
- **Dashboard**: shows the count of unique materials currently in stock as "Materiais no Pátio", linking to the Materials page; "Cargas Ativas" links to the Estoque (inventory) page.
