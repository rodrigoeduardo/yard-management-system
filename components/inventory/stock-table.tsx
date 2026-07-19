"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatWeightKg } from "@/lib/format/weight";
import { cn } from "@/lib/utils";

export type StockRow = {
  id: string;
  notaFiscal: string;
  entryDate: string;
  nfWeight: string;
  material: string;
  itemCount: number;
  remainingWeight: string;
  finished: boolean;
};

const HEADER_CLASS =
  "h-auto py-3 text-[11px] font-bold tracking-wide text-muted-foreground uppercase";

const COLUMN_WIDTHS = [
  "w-[120px]",
  "w-[140px]",
  "w-[150px]",
  "",
  "w-[130px]",
  "w-[140px]",
];

function numericCell(value: string | number, highlight: boolean) {
  return (
    <span
      className={cn(
        "font-mono",
        highlight && "font-bold text-success-foreground",
      )}
    >
      {value}
    </span>
  );
}

const columns: ColumnDef<StockRow>[] = [
  {
    accessorKey: "notaFiscal",
    header: "NF",
    cell: ({ row }) => (
      <span className="font-mono font-bold">{row.original.notaFiscal}</span>
    ),
  },
  {
    accessorKey: "entryDate",
    header: "Data de Entrada",
    cell: ({ row }) => (
      <span className="font-mono text-foreground">{row.original.entryDate}</span>
    ),
  },
  {
    accessorKey: "nfWeight",
    header: "Peso da NF",
    cell: ({ row }) => (
      <span className="font-mono">{formatWeightKg(row.original.nfWeight)}</span>
    ),
  },
  {
    accessorKey: "material",
    header: "Material",
    cell: ({ row }) => (
      <span className="flex items-center gap-2.5 font-semibold">
        {row.original.material}
        {row.original.finished && <Badge variant="success">Finalizada</Badge>}
      </span>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Qtd. de Itens",
    cell: ({ row }) => numericCell(row.original.itemCount, row.original.finished),
  },
  {
    accessorKey: "remainingWeight",
    header: "Peso Restante",
    cell: ({ row }) =>
      numericCell(
        formatWeightKg(row.original.remainingWeight),
        row.original.finished,
      ),
  },
];

export function StockTable({
  rows,
  onRowClick,
}: {
  rows: StockRow[];
  onRowClick?: (row: StockRow) => void;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="table-fixed">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => (
              <TableHead
                key={header.id}
                className={cn(HEADER_CLASS, COLUMN_WIDTHS[index])}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-finished={row.original.finished || undefined}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            onKeyDown={
              onRowClick
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }
                : undefined
            }
            className={cn(
              onRowClick && "cursor-pointer",
              row.original.finished && "bg-success/10 hover:bg-success/10",
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="text-[13.5px]">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
