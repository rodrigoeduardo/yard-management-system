"use client";

import { Button } from "@/components/ui/button";

/** Page controls for the stock section; renders nothing for a single page. */
export function StockPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação do estoque"
      className="flex items-center justify-between gap-3 pt-1"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </Button>
    </nav>
  );
}
