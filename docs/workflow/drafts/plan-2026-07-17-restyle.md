# Plan draft — Design restyle (Controle de Estoque, mobile + desktop) — 2026-07-17

Source: design handoff `Controle de Estoque.dc.html` (hi-fi mockup, 8 screens, mobile 390×844 + desktop 1280×800). **Light mode only** (dark explored, dropped). Restyle existing pages to match — **no data-model / server-action / business-logic changes**; `lib/**` stays as-is. Stack unchanged (Next.js App Router, Tailwind v4 CSS tokens, base-ui, lucide-react, TanStack Table, `@zxing/browser`).

## Build convention (applies to every issue)

**Mobile-first**, matching the handoff ("designed mobile-first, desktop added afterward") and Tailwind's default cascade: the **unprefixed classes are the mobile (390px) layout**; desktop is layered on with `md:`/`lg:` prefixes. No `max-*` reverse overrides to retrofit a desktop-first build. Each screen's acceptance criteria below name the mobile base first, then the desktop delta. Reviewers verify the 390px layout renders correctly with desktop breakpoints disabled.

**Pixel-perfect to the mockup** — mandatory, and each issue below carries this as an explicit acceptance checkbox:

- At the **two reference viewports (390px and 1280px)** the page must match the corresponding `data-screen-label` frame in `Controle de Estoque.dc.html` **exactly** for: spacing/padding/gap, element dimensions, border-radius, border/background/text colors, font family + size + weight, and copy. Values come from the handoff tokens and the frame's inline styles — translated into the issue-A token names, **not** re-eyeballed.
- Between 390px and 1280px the layout is **fluid** (the mockup does not specify intermediate widths); "pixel-perfect" is asserted only at the two reference widths, and nothing may break/overflow in between.
- **Verification is required in the PR**: attach before/after screenshots at 390px and 1280px next to the matching mockup frame, or a note stating the measured values match. A reviewer can reject on any visible deviation at either reference width.
- Where a mockup value has no token (one-off px), use the exact value from the frame's inline style — do not round to a nearby Tailwind step if it changes the pixel result.

## Decisions (locked by human, 2026-07-17)

1. **Fonts → Add Instrument Sans + Spline Sans Mono** via `next/font/google` to match the mockup exactly (UI = Instrument Sans, numeric/mono = Spline Sans Mono). Replaces the current Geist Sans/Mono wiring in `app/layout.tsx` + `globals.css`. Drives issue A.
2. **Nova Carga → Implement as designed** — mobile two-step flow (Etapa 1 dados → Etapa 2 pesos), desktop single-page two-column. Keeps the #E/#F split below.
3. **Home greeting/avatar.** Mockup shows "Bom dia, Rafael" + avatar initials. Assumed: derive from the session user if available, else a static greeting — kept minor/in-scope in #D.

No existing open issue conflicts with this batch (open: #35/#37/#38 are CI/deploy/auth, unrelated). No merged-PR notes cover styling. All items net-new.

## Proposed issues (dependency order)

| # | Title | Area | Depends on | Acceptance criteria (summary) | Human actions |
|---|---|---|---|---|---|
| A | [setup] Establish design tokens + fonts for the restyle | setup | — | `globals.css` `:root`/`@theme` carries the handoff palette (cool-neutral bg, blue primary + accent-tint, success green, borders, muted text) and radii (12–16px cards/inputs, full pills); `app/layout.tsx` loads Instrument Sans (UI) + Spline Sans Mono (numeric/mono) via `next/font/google`, replacing Geist, wired to `--font-sans`/`--font-mono`. Tokens referenced by name (no raw oklch scattered in components). Dark mode not added. | None |
| B | [setup] Add shared styled UI primitives (Card, Input, Badge, StatCard, SectionLabel) | setup | A | Reusable components under `components/ui/` matching the mockup: `Card` (white, 1px border, no shadow, radius), `Input` (44px, mono variant + unit-suffix slot), `Badge`/pill (incl. green "Finalizada"), `StatCard`, `SectionLabel` (uppercase muted). Used by ≥2 later screens; unit-rendered in a component test. | None |
| C | [setup] Responsive app nav shell (mobile bottom tab bar + desktop top-nav) | setup | A, B | `(authenticated)/layout.tsx` base (mobile) renders a fixed bottom tab bar (Início/Carga/Remoção/Estoque) with content padded so it never overlaps; at `md:` the bottom bar is hidden and a top-nav (logo, links, avatar, Sair) shows instead; active section highlighted from pathname. Logout action unchanged. | None |
| D | [setup] Restyle Home into the dashboard (stat cards + action cards + última movimentação) | setup | A, B, C | Home shows 3 stat cards (cargas ativas / itens no pátio / peso restante) from a new read-only aggregate query over `loads`, 3 action cards (icon+title+desc → existing routes), and a "última movimentação" card from the most-recent removal. Numeric values use the mono treatment. Empty/zero states render. | None |
| E | [load-intake] Restyle Nova Carga — NF-data form + item-count stepper + responsive shell | load-intake | A, B, C | Mobile base is Etapa 1: NF/date/weight/material fields restyled (mono where numeric, kg suffix on weight), item count as a +/− stepper (1–20) driving `handleItemCountChange`, sticky "Continuar para pesos" CTA. At `md:` the step-through collapses into a single page laying form + weights panel in two columns (per decision #2). No change to `createLoad` call/validation. | None |
| F | [load-intake] Restyle Nova Carga — weights grid + live summary/progress + gated CTA | load-intake | E | Per-item weight inputs in a grid (mobile base 2 cols → `md:` 4 cols, sized to itemCount, kg suffix); a summary card shows live Peso Restante (sum) vs Peso da NF with a fill-progress bar; primary CTA "Criar carga e gerar N QR Codes" disabled until all weights entered; mobile back-to-Etapa-1. Same `createLoad` submit + existing per-index error mapping. | None |
| G | [qrcode] Restyle QR print page (success banner + NF chip + QR card grid) | qrcode | A, B, C | Success banner "Carga registrada no estoque", NF/material context chip, QR cards in a grid (mobile base 2 cols → `md:` 4 cols) showing the real generated QR (`getLoadItemQrCodes`), identifier, material, weight; styled action buttons (Imprimir / Voltar ao estoque / Adicionar outra carga). `@media print` still lays all items on one page (keep `print:grid-cols-3`). | None |
| H | [load-removal] Restyle Nova Remoção (scanner viewport + scanned list + sticky total bar) | load-removal | A, B, C | Exit-date + driver fields fixed on top; camera viewport styled with corner brackets + scan-line overlay (live `@zxing/browser` unchanged); scanned items render as cards/chips (Item / NF / material / weight + remove); sticky bottom bar shows live Peso Total Removido + "Concluir Remoção (N itens)". Inline scan errors (invalid/duplicate/removed) preserved. | None |
| I | [load-removal] Restyle Revisar Remoção review sheet | load-removal | H | The base-ui `Dialog` restyled as a bottom-sheet/modal: Data de Saída, Motorista, items grouped by Nota Fiscal, highlighted Peso Total Removido, Cancelar / Confirmar. Same `removeItems` submit + success/receipt flow. | None |
| J | [inventory-view] Restyle Estoque — segmented control + Estoque Atual (responsive) | inventory-view | A, B, C | A segmented control (Estoque Atual / Remoções) at top toggles the two views. Estoque Atual: mobile base = stacked cards → `md:` full table, same columns (NF, Data, Peso da NF, Material, Qtd. Itens, Peso Restante); finished rows (`isLoadFinished`) get the green tint + "Finalizada" badge + green numerics in both layouts. Ordering unchanged (`desc(updatedAt)`). | None |
| K | [inventory-view] Restyle Estoque — Histórico de Remoções (responsive) | inventory-view | J | Under the "Remoções" segment: mobile base = stacked cards → `md:` full table (Data de Saída, Motorista, Notas Fiscais, Itens, Peso Total Removido); most-recent-first ordering preserved; read-only. Existing row-click detail modals kept. | None |

## Notes

- Every issue is presentation-only over existing `lib/**`; server actions, Zod validation, and QR/scan logic are reused unchanged. Any deviation found mid-build → PR Notes, not scope creep.
- Every created issue body carries the **pixel-perfect acceptance checkbox** from the build convention, naming the exact `data-screen-label` frame(s) it must match (e.g. #J → "Estoque Atual" mobile + "Desktop Estoque"), plus the 390/1280 screenshot-verification requirement.
- #A and #B are the shared foundation; #C is shared chrome. #D–#K each map to one screen (or one screen-half) and are individually builder-session-sized.
- No `human-action-needed` on any issue — all changes are code; decisions #1/#2/#3 are resolved by the human at approval, not runtime steps.
