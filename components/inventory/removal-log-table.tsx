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
  itemCount: number;
};

const HEADER_CLASS =
  "h-auto py-3 text-[11px] font-bold tracking-wide text-muted-foreground uppercase";

const COLUMN_WIDTHS = ["w-[150px]", "", "w-[300px]", "w-[110px]", "w-[170px]"];

const columns: ColumnDef<RemovalLogRow>[] = [
  {
    accessorKey: "exitDate",
    header: "Data de Saída",
    cell: ({ row }) => (
      <span className="font-mono font-bold">{row.original.exitDate}</span>
    ),
  },
  {
    accessorKey: "driver",
    header: "Motorista",
    cell: ({ row }) => <span className="font-semibold">{row.original.driver}</span>,
  },
  {
    accessorKey: "notasFiscais",
    header: "Notas Fiscais",
    cell: ({ row }) => (
      <span className="font-mono text-[12px] text-foreground">
        {row.original.notasFiscais}
      </span>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Itens",
    cell: ({ row }) => <span className="font-mono">{row.original.itemCount}</span>,
  },
  {
    accessorKey: "totalRemovedWeight",
    header: "Peso Total Removido",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-accent-foreground">
        {row.original.totalRemovedWeight}
      </span>
    ),
  },
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
