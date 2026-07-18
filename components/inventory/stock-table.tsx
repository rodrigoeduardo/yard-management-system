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

function numericCell(value: string | number, finished: boolean) {
  return (
    <span
      className={cn("font-mono", finished && "text-success-foreground")}
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
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.notaFiscal}</span>
        {row.original.finished && <Badge variant="success">Finalizada</Badge>}
      </div>
    ),
  },
  { accessorKey: "entryDate", header: "Data de Entrada" },
  {
    accessorKey: "nfWeight",
    header: "Peso da Nota Fiscal",
    cell: ({ row }) => numericCell(row.original.nfWeight, row.original.finished),
  },
  { accessorKey: "material", header: "Material" },
  {
    accessorKey: "itemCount",
    header: "Quantidade de Itens",
    cell: ({ row }) => numericCell(row.original.itemCount, row.original.finished),
  },
  {
    accessorKey: "remainingWeight",
    header: "Peso Restante",
    cell: ({ row }) =>
      numericCell(row.original.remainingWeight, row.original.finished),
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
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
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
              row.original.finished &&
                "bg-success/15 hover:bg-success/15",
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
