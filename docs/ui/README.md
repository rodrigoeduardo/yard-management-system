# Handoff: Controle de Estoque de Pátio — Mobile + Desktop

## Overview
UI design for a yard-inventory app with three core functions: Adicionar Carga (register incoming load + print item QR codes), Remover Carga (scan QR codes to exit items), and Estoque (read-only stock + removal-history tables). Designed mobile-first, with equivalent desktop layouts added afterward.

## About the Design Files
The file in this bundle (`Controle de Estoque.dc.html`) is a **design reference built in HTML** — a prototype showing intended look, layout, and copy. It is not production code. The existing codebase (`yard-management-system`, a Next.js + TypeScript + Tailwind + Drizzle/Supabase app) already implements these three flows functionally with plain unstyled markup. The task is to **restyle/rebuild the existing Next.js pages and components to match this design**, reusing the codebase's existing patterns (Tailwind classes, shadcn/base-ui `Button`/`Table` components, TanStack Table, `@zxing/browser` QR scanning, server actions in `lib/actions/*`) — do not introduce a new framework. Layout/markup should change to match the design; the data-fetching, validation, and business logic already in `lib/` stay as-is.

## Fidelity
**High-fidelity.** All screens use final colors, typography, spacing values, and copy (in Portuguese, matching the existing app's language). Recreate pixel-close using Tailwind — translate the inline oklch/px values below into the codebase's Tailwind config (extend `tailwind.config`/`globals.css` CSS variables) rather than hardcoding raw oklch everywhere.

## Screens / Views
All screens are laid out in one canvas file, in two groups: mobile (390×844, iPhone-style bezel) at the bottom, desktop (1280×800, browser-chrome bezel) at the top. Each screen has a `data-screen-label` attribute naming it.

1. **Início (Home)** — mobile: header with logo + settings icon, 3 stat cards (cargas ativas / itens no pátio / peso restante), 3 action cards (Adicionar Carga, Remover Carga, Ver Estoque) each with icon+title+description, a "última movimentação" card, and a fixed bottom tab bar (Início / Carga / Remoção / Estoque). Desktop: top nav bar with logo + horizontal links + avatar + Sair button, replacing bottom tabs; otherwise same content in a 3-column stat grid and 3-column action grid.

2. **Nova Carga — Etapa 1 (dados da NF)** — form: Nota Fiscal, Data de Entrada (date), Peso da Nota Fiscal (kg suffix), Material, Quantidade de Itens (stepper, 1–20, default center display). Sticky bottom CTA "Continuar para pesos". Desktop: same fields in a left column card, paired with the weights panel in a right column (single page, no step-through).

3. **Nova Carga — Etapa 2 (pesos)** — NF context chip, then a grid of "Item N" weight inputs (2 columns mobile / 4 columns desktop) sized to itemCount (max 20), each with "kg" suffix. Sticky/bottom summary card: computed Peso Restante (sum of entered weights), reference Peso da NF, progress bar of filled fields, CTA "Criar carga e gerar N QR Codes" (disabled until all weights entered).

4. **QR Codes (impressão)** — success banner "Carga registrada no estoque", NF/material context chip, grid of QR cards (2 cols mobile / 4 cols desktop) each showing a QR placeholder graphic, "Item N — NF ######", material, and item weight. Bottom actions: primary "Imprimir N etiquetas em 1 folha", secondary "Voltar ao estoque" (+ "Adicionar outra carga" per existing app). Print should render all items in one page (existing app already does `print:grid-cols-3` — keep that intent for the print media query).

5. **Nova Remoção** — Data de Saída + Motorista fields (fixed for the whole action), a scanner viewport (camera feed placeholder with corner brackets + scan line), a "Simular leitura de QR" dashed action button (maps to existing camera-scan flow — in the real app this stays the live `@zxing/browser` camera view, the dashed button is only for the design-tool simulate-a-scan affordance if kept for QA/demo), a running list of scanned items (Item N chip, NF chip, material, weight, remove button), and a bottom bar showing live Peso Total Removido + "Concluir Remoção (N itens)" CTA.

6. **Revisar Remoção (confirmation sheet)** — bottom sheet/modal (existing app already uses a `Dialog` from `@base-ui/react`) showing Data de Saída, Motorista, items grouped by Nota Fiscal, total Peso Total Removido highlighted, Cancelar / Confirmar buttons.

7. **Estoque — Estoque Atual** — segmented control (Estoque Atual / Remoções) at top. Mobile: stacked cards per load (NF, material chip, date, Peso da NF / Qtd. de Itens / Peso Restante); desktop: full data table with the same columns. Rows where Quantidade de Itens and Peso Restante both hit zero get a green finished treatment (background tint + "Finalizada" badge + green numeric values) — matches the existing app's `bg-green-100`/`text-green-700` intent, just restyled.

8. **Estoque — Histórico de Remoções** — second segmented tab. Mobile: stacked cards (date, motorista, total weight, NF chips, item count); desktop: full data table (Data de Saída, Motorista, Notas Fiscais, Itens, Peso Total Removido). Read-only, sorted most-recent-first (existing app already orders this via `desc(loads.updatedAt)` / removal list — keep that ordering).

Dark mode was explored but the user decided **not** to pursue it — build light mode only.

## Interactions & Behavior
- Item count stepper (+/−) in Nova Carga regenerates the weight-input grid in step 2 (existing app already does this with `handleItemCountChange`).
- Weight-sum calculation happens live as each per-item weight is typed; Peso Restante does not need to equal Peso da Nota Fiscal (informational only).
- QR scan (real camera in prod) adds a scanned item to the running list; duplicate/already-removed tokens should show an inline error (existing app already implements this via `checkItemStatus`/`safeDecodeItemQrPayload`).
- "Concluir Remoção" opens the review sheet; "Confirmar" submits and reduces `itemCount`/`remainingWeight` on each affected load, and creates a removal-log entry with `totalRemovedWeight`.
- Tables are view-only — no inline editing, sorting is fixed to most-recent-first.
- Bottom tab bar / top nav highlight the active section.

## State Management
Reuse the existing app's state shape — no new data model needed:
- `lib/db/schema.ts` — loads / items / removals / removal-log tables already model this.
- `lib/actions/loads.ts`, `lib/actions/removals.ts`, `lib/actions/item-status.ts` — server actions already implement create-load, remove-items, status-check.
- `lib/inventory/stock.ts` (`isLoadFinished`) already computes the "finished" (green) state — reuse for the styled table/cards.
- `lib/qrcode/generate.ts` / `payload.ts` already handle QR payload encode/decode — reuse as-is.

## Design Tokens
- **Font**: Instrument Sans (UI text), Spline Sans Mono (numeric/mono values: weights, NF numbers, dates, quantities) — both via Google Fonts. If the codebase should keep Geist (current `next/font` setup), swap these for Geist Sans/Geist Mono at equivalent weights instead of adding new font loads.
- **Background**: `oklch(0.966 0.004 250)` app background (near-white cool neutral), cards `oklch(1 0 0)` white, borders `oklch(0.908 0.008 250)`.
- **Text**: primary `oklch(0.225 0.015 260)`, secondary/muted `oklch(0.52 0.015 260)`.
- **Accent (primary/brand)**: `oklch(0.51 0.13 245)` (blue), accent-tint background `oklch(0.93 0.035 245)`, accent-tint text `oklch(0.44 0.12 245)`.
- **Success/finished-state green**: text `oklch(0.38 0.09 150)` / `oklch(0.5 0.12 150)`, tint background `oklch(0.93 0.05 150)`.
- **Radii**: cards/inputs 12–16px, buttons 12–14px, phone bezel 28px, desktop window 16px, pills/badges 999px (full).
- **Spacing scale used**: 4/6/8/10/12/14/16/20/22/26/32px gaps and paddings — no fixed 8pt-grid rigidity, but stays close to a 2px-multiple scale.
- **Shadows**: soft, low-opacity long shadows for phone/desktop bezels only (`0 24px 48px -28px oklch(0.25 0.02 255 / 0.35)`); UI cards themselves use border only, no shadow.

## Assets
No custom icons/images — all icons are inline stroked SVGs (Lucide-style, 1.8–2.2px stroke, rounded caps/joins) drawn directly in the file; recreate with an icon library already in the codebase (e.g., `lucide-react`) rather than copying the raw SVG paths. QR codes are placeholder graphics (a conic-gradient checker + three corner "finder" squares) standing in for real generated QR images — the existing app's `lib/qrcode/generate.ts` already produces real QR data URLs; use those in production instead of the placeholder graphic.

## Files
- `Controle de Estoque.dc.html` — the full design canvas (all mobile + desktop screens, in one file). Open directly in a browser to view/interact with the layout reference. This is a Design Component (`.dc.html`) authored for an internal design tool — a developer can ignore its `<x-dc>`/templating wrapper and treat the rendered HTML/CSS as the visual reference.
