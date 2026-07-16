# Overview — Yard Inventory Management App

Web application for tracking yard inventory. Material arrives in **loads** identified by a Nota Fiscal (NF — Brazilian invoice; see [glossary](glossary.md)), and every item in a load is tracked individually via a printed QR code.

Three core functions:

1. **Add Load** (`load-intake`) — register an incoming load and its items, then print one QR code per item.
2. **Load Removal** (`load-removal`) — scan item QR codes to remove them from the yard, recording exit date and driver.
3. **Inventory View** (`inventory-view`) — read-only tables showing current stock per load and the history of removals.

## Expected volume

More than 100 operations/day — low volume, comfortably inside any modern free tier. Stack choices prioritize data-model correctness and low infra cost, not scale capacity.

## Detailed specs

- [Business rules](business-rules.md)
- [Architecture](architecture.md)
- [Data model](data-model.md)
- [Glossary](glossary.md)
