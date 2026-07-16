# Business Rules

Source of truth for application behavior. Translated and expanded from the original project proposal (original Portuguese version preserved in git history: first commit's `CLAUDE.md`).

## Add Load (`load-intake`)

- Creates a `load` object with: **Nota Fiscal (NF)**, **Entry Date**, **NF Weight**, **Material**, **Item Count**.
- From Item Count, the form generates N fields for each item's individual weight (typically 15–18 items, recommended maximum 20).
- All other parameters (NF, entry date, material) are shared by every item in the load; only weight varies per item.
- The sum of individual item weights produces the load's **Remaining Weight**. It does **not** need to match the NF Weight.
- On completion, generate one QR code per item containing: an identifier (e.g. "Item 1 - <NF>"), the material, and the item's weight.
- QR codes must be printable in batch, laid out in order on a single page.

## Load Removal (`load-removal`)

- A removal action starts with manual input of **Exit Date** and **Driver** — fixed for every item removed in that action.
- Scanning an item's QR code adds the item to the removal.
- Removing an item:
  - decrements the corresponding load's **Item Count**, and
  - subtracts the item's weight from that load's **Remaining Weight**.
- A single removal action may scan items from **different loads** (different NFs).
- On completion, compute **Total Removed Weight** = sum of the weights of all items removed in the action.

## Inventory View (`inventory-view`)

- **Table 1 — current stock**: loads ordered by last modification (most recent on top). Columns: NF, Entry Date, NF Weight, Material (fixed) + Item Count, Remaining Weight (variable). When both Item Count and Remaining Weight reach zero, display the row in green (load finished).
- **Table 2 — removal log**: removals ordered by last modification (most recent on top). Columns: Exit Date, Driver, Total Removed Weight, NFs involved in the removal.
- Both tables are read-only.
