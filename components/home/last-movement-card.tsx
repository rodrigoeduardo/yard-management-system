import { SectionLabel } from "@/components/ui/section-label";
import { formatEntryDateTime } from "@/lib/format/datetime";

export type LastRemovalSummary = {
  driver: string;
  exitDate: Date;
  itemCount: number;
  totalRemovedWeight: string;
  vehiclePlate: string;
  notasFiscais: string[];
};

export type LastLoadSummary = {
  notaFiscal: string;
  material: string;
  entryDate: Date;
  nfWeight: string;
};

type Row = {
  key: string;
  sortDate: Date;
  title: string;
  meta: string;
  nf?: string;
};

function removalToRow(removal: LastRemovalSummary): Row {
  const nf = removal.notasFiscais
    .map((notaFiscal) => `NF ${notaFiscal}`)
    .join(" · ");
  return {
    key: "removal",
    sortDate: removal.exitDate,
    title: `Remoção · ${removal.driver}`,
    meta: `${formatEntryDateTime(removal.exitDate)} · ${removal.itemCount} itens · ${removal.totalRemovedWeight} Ton · ${removal.vehiclePlate}`,
    nf: nf || undefined,
  };
}

function loadToRow(load: LastLoadSummary): Row {
  return {
    key: "load",
    sortDate: load.entryDate,
    title: `Carga · NF ${load.notaFiscal}`,
    meta: `${formatEntryDateTime(load.entryDate)} · ${load.material} · ${load.nfWeight} Ton`,
  };
}

function MovementRow({ row }: { row: Row }) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3.5 md:gap-3.5 md:px-5 md:py-4">
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-foreground md:text-sm">
          {row.title}
        </span>
        <span className="text-xs text-muted-foreground md:text-[12.5px]">
          {row.meta}
        </span>
      </span>
      {row.nf && (
        <span className="shrink-0 font-mono text-xs text-accent-foreground md:text-[13px]">
          {row.nf}
        </span>
      )}
    </li>
  );
}

/**
 * "Última movimentação" card showing up to two rows: the most recent
 * removal and the most recent load, ordered most recent first. Renders
 * nothing when neither exists.
 */
export function LastMovementCard({
  removal,
  load,
}: {
  removal: LastRemovalSummary | null;
  load: LastLoadSummary | null;
}) {
  if (!removal && !load) {
    return null;
  }

  const rows = [
    removal ? removalToRow(removal) : null,
    load ? loadToRow(load) : null,
  ]
    .filter((row): row is Row => row !== null)
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Última Movimentação</SectionLabel>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <MovementRow key={row.key} row={row} />
        ))}
      </ul>
    </div>
  );
}
