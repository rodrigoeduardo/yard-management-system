"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const columns: ColumnDef<StockRow>[] = [
  { accessorKey: "notaFiscal", header: "NF" },
  { accessorKey: "entryDate", header: "Data de Entrada" },
  { accessorKey: "nfWeight", header: "Peso da Nota Fiscal" },
  { accessorKey: "material", header: "Material" },
  { accessorKey: "itemCount", header: "Quantidade de Itens" },
  { accessorKey: "remainingWeight", header: "Peso Restante" },
];

export function StockTable({ rows }: { rows: StockRow[] }) {
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
            className={cn(
              row.original.finished &&
                "bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30",
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
