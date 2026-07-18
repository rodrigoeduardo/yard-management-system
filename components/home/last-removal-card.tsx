import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export type LastRemovalSummary = {
  driver: string;
  exitDate: string;
  itemCount: number;
  totalRemovedWeight: string;
  notasFiscais: string[];
};

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

/**
 * "Última movimentação" card summarizing the most recent removal. Renders
 * nothing when there is no removal yet.
 */
export function LastRemovalCard({
  removal,
}: {
  removal: LastRemovalSummary | null;
}) {
  if (!removal) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <SectionLabel>Última Movimentação</SectionLabel>
      <dl className="grid grid-cols-2 gap-3">
        <Field label="Motorista" value={removal.driver} />
        <Field label="Data de Saída" value={removal.exitDate} />
        <Field label="Qtd. de Itens" value={removal.itemCount} />
        <Field
          label="Peso Total Removido"
          value={`${removal.totalRemovedWeight} kg`}
        />
        <div className="col-span-2 flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Notas Fiscais</dt>
          <dd className="text-sm text-foreground">
            {removal.notasFiscais.join(", ")}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
