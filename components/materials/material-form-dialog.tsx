"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type MaterialFormResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Add/edit dialog for a material's name, shared by "Add material" and the
 * per-row "Editar" affordance. Callers mount this only while `open` is
 * true (see `MaterialsView`), so each open is a fresh mount and local
 * state always starts from `initialName` — no effect-based reset needed.
 */
export function MaterialFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName = "",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  initialName?: string;
  onSubmit: (name: string) => Promise<MaterialFormResult>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);

    startTransition(async () => {
      const result = await onSubmit(name);
      if (!result.success) {
        setError(result.message);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl px-[22px] py-5 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label
            htmlFor="material-name"
            className="text-sm font-medium text-foreground"
          >
            Nome
          </label>
          <Input
            id="material-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            autoFocus
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
