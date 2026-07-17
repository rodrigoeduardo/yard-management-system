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

export type RemovalLogRow = {
  id: string;
  exitDate: string;
  driver: string;
  totalRemovedWeight: string;
  notasFiscais: string;
};

const columns: ColumnDef<RemovalLogRow>[] = [
  { accessorKey: "exitDate", header: "Data de Saída" },
  { accessorKey: "driver", header: "Motorista" },
  { accessorKey: "totalRemovedWeight", header: "Peso Total Removido" },
  { accessorKey: "notasFiscais", header: "Notas Fiscais" },
];

export function RemovalLogTable({
  rows,
  onRowClick,
}: {
  rows: RemovalLogRow[];
  onRowClick?: (row: RemovalLogRow) => void;
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
            className={cn(onRowClick && "cursor-pointer")}
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
