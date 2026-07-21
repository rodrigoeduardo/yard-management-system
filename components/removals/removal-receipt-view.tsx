import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatWeight } from "@/lib/format/weight";
import type { RemovalReceipt } from "@/lib/removals/receipt";

function itemsLabel(count: number): string {
  return count === 1 ? "item" : "itens";
}

function notasFiscaisLabel(count: number): string {
  return count === 1 ? "nota fiscal" : "notas fiscais";
}

interface RemovalReceiptViewProps {
  receipt: RemovalReceipt;
  onNewRemoval: () => void;
  onViewInventory: () => void;
}

/**
 * Presentational view for the post-submit removal receipt: header, success
 * banner and action buttons render two layouts (mobile stack vs. desktop
 * header row, toggled by `hidden`/`md:flex`), styled after the QR Codes
 * screen (`QrPrintView`) so both post-success screens share the same
 * design language.
 */
export function RemovalReceiptView({
  receipt,
  onNewRemoval,
  onViewInventory,
}: RemovalReceiptViewProps) {
  const notasFiscaisCount = receipt.byNotaFiscal.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden items-center gap-3.5 md:flex">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">
            Remoção Concluída
          </h1>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-foreground">
              {receipt.itemCount} {itemsLabel(receipt.itemCount)}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <span className="text-muted-foreground">
              {notasFiscaisCount} {notasFiscaisLabel(notasFiscaisCount)}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <span className="font-mono font-semibold text-foreground">
              {receipt.vehiclePlate}
            </span>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-[11px] bg-success px-3.5 py-[9px] text-[12.5px] font-semibold text-success-foreground">
          <CheckCircle2 className="size-[15px]" />
          Remoção registrada
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onViewInventory}
          className="h-[46px] rounded-[12px] px-5 text-[13.5px]"
        >
          Ver Estoque
        </Button>
        <Button
          type="button"
          onClick={onNewRemoval}
          className="h-[46px] rounded-[12px] px-[22px] text-[13.5px]"
        >
          Nova Remoção
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex items-center gap-2.5 rounded-[14px] border border-success bg-success px-3.5 py-3 text-success-foreground">
          <CheckCircle2 className="size-[18px] shrink-0" />
          <span className="text-[13px] font-semibold">
            Remoção registrada no estoque
          </span>
        </div>

        <Badge className="w-fit items-center gap-1.5 rounded-[14px] border border-border bg-card px-3.5 py-3 text-[12.5px] text-foreground">
          <span className="font-semibold">
            {receipt.itemCount} {itemsLabel(receipt.itemCount)}
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="text-muted-foreground">
            {notasFiscaisCount} {notasFiscaisLabel(notasFiscaisCount)}
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="font-mono font-semibold">
            {receipt.vehiclePlate}
          </span>
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        {receipt.byNotaFiscal.map((group) => (
          <Card key={group.notaFiscal} className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-[6px] bg-accent px-[7px] py-0.5 font-mono text-[11px] font-semibold text-accent-foreground">
                {group.notaFiscal}
              </span>
              <span className="text-[12.5px] text-muted-foreground">
                {group.items[0]?.material}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li
                  key={item.qrToken}
                  className="flex items-center justify-between gap-2 text-[13.5px] text-foreground"
                >
                  <span className="truncate">{item.identifier}</span>
                  <span className="shrink-0 font-mono font-medium text-muted-foreground">
                    {formatWeight(item.weight)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-[14px] bg-accent px-4 py-3.5">
        <span className="text-[13.5px] font-semibold text-accent-foreground">
          Peso Total Removido
        </span>
        <span className="font-mono text-lg font-bold text-accent-foreground">
          {formatWeight(receipt.totalRemovedWeight)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 md:hidden">
        <Button
          type="button"
          onClick={onNewRemoval}
          className="h-[52px] rounded-[14px] text-[15px]"
        >
          Nova Remoção
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onViewInventory}
          className="h-12 rounded-[14px]"
        >
          Ver Estoque
        </Button>
      </div>
    </div>
  );
}
