import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { formatEntryDateTime, formatYardDate } from "@/lib/format/datetime";

export type LastRemovalSummary = {
  driver: string;
  exitDate: Date;
  itemCount: number;
  totalRemovedWeight: string;
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
    meta: `${formatYardDate(removal.exitDate)} · ${removal.itemCount} itens · ${removal.totalRemovedWeight} kg`,
    nf: nf || undefined,
  };
}

function loadToRow(load: LastLoadSummary): Row {
  return {
    key: "load",
    sortDate: load.entryDate,
    title: `Carga · NF ${load.notaFiscal}`,
    meta: `${load.material} · ${formatEntryDateTime(load.entryDate)} · ${load.nfWeight} kg`,
  };
}

function MovementRow({ row }: { row: Row }) {
  return (
    <li className="flex items-center gap-3.5 rounded-card border border-border bg-card px-5 py-4">
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">
          {row.title}
        </span>
        <span className="text-xs text-muted-foreground">{row.meta}</span>
      </span>
      {row.nf && (
        <span className="shrink-0 font-mono text-sm text-primary">
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
    <Card className="flex flex-col gap-3 p-5">
      <SectionLabel>Última Movimentação</SectionLabel>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <MovementRow key={row.key} row={row} />
        ))}
      </ul>
    </Card>
  );
}
