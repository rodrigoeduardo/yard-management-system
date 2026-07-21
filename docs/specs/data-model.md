# Data Model

Sketch — final columns/constraints are settled by database tasks on the board, but relationships and invariants below are fixed by the business rules.

## Tables

- **`loads`**: `id`, `nota_fiscal`, `entry_date`, `nf_weight`, `material_id` (FK → materials), `item_count`, `remaining_weight`, `created_at`, `updated_at`
- **`materials`**: `id`, `name` (unique, not null)
- **`items`**: `id`, `load_id` (FK → loads), `weight`, `status` (`in_stock` / `removed`), `qr_token` (UUID embedded in the QR code), `created_at`
- **`removals`**: `id`, `exit_date`, `driver`, `vehicle_plate` (nullable text; required at the form level for new removals), `total_removed_weight`, `created_at`
- **`removal_items`**: `removal_id` (FK → removals), `item_id` (FK → items) — N:M junction
- **`users`**: managed by Supabase Auth
- **`audit_log`**: `id`, `table_name`, `record_id`, `action`, `user_id`, `old_data`, `new_data`, `created_at` — populated by triggers, never written by app code

## Invariants

- Removing an item is one ACID transaction touching `items` (status), `loads` (decrement `item_count`, subtract `remaining_weight`), `removals`, and `removal_items` — possibly across multiple loads in one removal action.
- An item can be removed at most once (`status` transition `in_stock` → `removed` is one-way).
- `remaining_weight` of a load = sum of weights of its `in_stock` items (maintained transactionally, not recomputed per read).
- A load is *finished* when `item_count = 0` and `remaining_weight = 0`.
- `qr_token` is unguessable (UUID) and unique across all items.
