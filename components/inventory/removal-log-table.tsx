import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
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

export type RemovalLogRow = {
  id: string;
  exitDate: string;
  driver: string;
  totalRemovedWeight: string;
  notasFiscais: string;
  itemCount: number;
};

const HEADER_CLASS =
  "h-auto px-5 py-3 text-[11px] font-bold tracking-[0.04em] text-muted-foreground uppercase";

const CELL_CLASS = "px-5 py-3.5 text-[13.5px]";

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
    cell: ({ row }) => (
      <span
        className="block truncate font-semibold"
        title={row.original.driver}
      >
        {row.original.driver}
      </span>
    ),
  },
  {
    accessorKey: "notasFiscais",
    header: "Notas Fiscais",
    cell: ({ row }) => (
      <span
        className="block truncate font-mono text-[12px] text-foreground"
        title={row.original.notasFiscais}
      >
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
        {formatWeightKg(row.original.totalRemovedWeight)}
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
    <Card className="overflow-hidden">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(HEADER_CLASS)}
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
                <TableCell key={cell.id} className={CELL_CLASS}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
