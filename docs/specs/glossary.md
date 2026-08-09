# Glossary

<!-- Domain terms, one per row. Agents use exactly these terms in code, issues, and
     commits — a shared language keeps everything greppable. Include translations if
     the UI language differs from the dev language. -->

| Term | English | Meaning |
|---|---|---|
| Nota Fiscal (NF) | (kept as-is) | Brazilian legal invoice document. Identifies a load. Not unique forever, but unique among open loads in practice. |
| Carga | Load | A shipment of material that arrives in the yard under one NF, split into individually tracked items. |
| Item | Item | One physical unit of a load, with its own weight, Corrida, and QR code. |
| Corrida | (kept as-is) | Heat/batch identifier read off an item at intake; varies item to item within the same load. Entered alongside the item's weight and printed on its label, directly below the weight line. Nullable — items created before this field existed keep it `NULL`. Descriptive only: it does not participate in scan/removal matching. |
| Remoção | Removal | An action that takes items out of the yard: one exit date + one driver, N scanned items, possibly from different loads. |
| Ordem de Transporte | Transport Order | Transport order reference from the inbound paperwork; recorded per load, alongside the NF. |
| Motorista (Carga) | Driver (Load) | Person who brought the load in; recorded per load at intake (`loads.driver`). Distinct from the removal's Motorista below — same column name, disambiguated by context. |
| Motorista (Remoção) | Driver (Removal) | Person transporting removed items; recorded per removal action (`removals.driver`). |
| Placa do veículo | Vehicle Plate | License plate of the vehicle transporting removed items; recorded per removal action, required at the form level. |
| Material | Material | A persisted entity (`name`) that categorizes a load's contents; selected or created inline on the load form. |
| Peso da Nota Fiscal | NF Weight | Total weight stated on the invoice. Reference only — need not equal the sum of item weights. |
| Peso Restante | Remaining Weight | Sum of the weights of a load's items still in stock. |
| Peso Total Removido | Total Removed Weight | Sum of the weights of all items removed in one removal action. |
| Estoque | Inventory / Stock | Everything currently in the yard, viewed per load. |
| Pátio | Yard | The physical storage area. |
| Demonstração (Demo) | Demo | Public, no-login deployment of the generic app; all visitors share one demo user and dataset, reset nightly (see ADR 0002/0003). |

## Units

- Weight values are displayed with the unit label **"Ton"** (tonnes) throughout the UI. This is a display convention only — stored values are not numerically converted.

## UI language note

End-user UI text defaults to Portuguese (the yard operators' language) and is served through an en/pt-br i18n toggle (`lib/i18n/`, issue #277): locale is detected server-side (a `NEXT_LOCALE` cookie, if set, wins; otherwise the `Accept-Language` header; otherwise pt-BR) and looked up via dictionaries (`lib/i18n/dictionaries/`) through a `t()` helper. Only pages migrated to `t()` honor the toggle — the login page is the first (see PR Notes on #277 for the per-page extraction follow-ups); everything else still renders hardcoded Portuguese until migrated. Everything dev-facing — code identifiers, comments, commits, issues, docs — stays English regardless of UI locale.
