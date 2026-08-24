"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MaterialOption = { id: string; name: string };

const MAX_VISIBLE_OPTIONS = 15;

/**
 * Below `md` (Tailwind's 768px breakpoint) the combobox opens as a full-screen
 * bottom sheet instead of an anchored popover — see the module doc comment
 * below `useIsMobileViewport` for why this is a guarded JS media query
 * rather than a pure CSS breakpoint.
 */
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

function subscribeToMobileViewport(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getIsMobileViewport(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/**
 * `useSyncExternalStore` with a server snapshot of `false` (desktop) keeps
 * SSR/hydration output stable: the mobile sheet markup below is gated behind
 * `open`, which can only ever become `true` from a client interaction, so
 * the two presentations are never both in the tree during hydration. This
 * mirrors the pattern already used for the desktop/mobile QR-scanner split in
 * `app/(authenticated)/removals/new/page.tsx`. A pure `md:hidden`/`hidden
 * md:block` CSS split was tried first, but Base UI's Popover positions its
 * popup with inline `transform`/`top`/`left` styles computed by floating-ui;
 * making that same popup act as a viewport-anchored bottom sheet on mobile
 * would mean fighting those inline styles with `!important` overrides tied
 * to Base UI's internal positioning implementation — fragile, and it still
 * requires either two separate popup instances (duplicate listbox/option
 * DOM, an accessibility and testing problem) or JS to pick one. Branching in
 * JS on the media query, gated behind `open`, is the smaller cost.
 */
function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeToMobileViewport,
    getIsMobileViewport,
    () => false,
  );
}

type MaterialComboboxProps = {
  id: string;
  materials: MaterialOption[];
  /** Submission value: an existing material's id, or a name to find-or-create. */
  value: string;
  /** Human-readable label shown in the field and elsewhere (e.g. the confirm chip). */
  displayValue: string;
  /** Called with (value, displayValue) on every keystroke and on option selection. */
  onChange: (value: string, displayValue: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function filterMaterials(
  materials: MaterialOption[],
  trimmedQuery: string,
): MaterialOption[] {
  if (!trimmedQuery) return materials;
  const lower = trimmedQuery.toLowerCase();
  return materials.filter((material) =>
    material.name.toLowerCase().includes(lower),
  );
}

export function MaterialCombobox({
  id,
  materials,
  displayValue,
  onChange,
  placeholder,
  required,
  className,
}: MaterialComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Guards against a focus-restoration feedback loop: closing the mobile
   * sheet moves focus back to the field, which would otherwise fire the
   * field's own `onFocus` handler and immediately reopen it.
   */
  const restoringFocusRef = useRef(false);
  const isMobile = useIsMobileViewport();

  const trimmedQuery = query.trim();
  const filtered = useMemo(
    () => filterMaterials(materials, trimmedQuery).slice(0, MAX_VISIBLE_OPTIONS),
    [materials, trimmedQuery],
  );
  const showCreateOption = trimmedQuery !== "";

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: PopoverPrimitive.Root.ChangeEventDetails,
  ) {
    // The input isn't a base-ui Popover.Trigger, so it's never registered as
    // the popover's reference element. Without that registration, base-ui's
    // outside-press dismiss logic treats every click as "outside" — including
    // the very click on the input that opens it — closing it immediately.
    if (
      !nextOpen &&
      eventDetails.reason === "outside-press" &&
      inputRef.current?.contains(eventDetails.event.target as Node)
    ) {
      return;
    }
    setOpen(nextOpen);
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      restoringFocusRef.current = true;
      inputRef.current?.focus();
    }
  }

  function handleFieldFocus() {
    if (restoringFocusRef.current) {
      restoringFocusRef.current = false;
      return;
    }
    setOpen(true);
  }

  function handleInputChange(newValue: string) {
    setQuery(newValue);
    setOpen(true);
    onChange(newValue, newValue);
  }

  function handleSelectExisting(material: MaterialOption) {
    setQuery(material.name);
    setOpen(false);
    onChange(material.id, material.name);
  }

  function handleSelectCreate() {
    const trimmed = query.trim();
    setQuery(trimmed);
    setOpen(false);
    onChange(trimmed, trimmed);
  }

  const optionRows = (
    <>
      {!showCreateOption && filtered.length === 0 && (
        <CommandEmpty>Nenhum material cadastrado.</CommandEmpty>
      )}
      {showCreateOption && (
        <CommandItem
          value={`__create__${trimmedQuery}`}
          onSelect={handleSelectCreate}
        >
          Adicionar &quot;{trimmedQuery}&quot;
        </CommandItem>
      )}
      {filtered.map((material) => (
        <CommandItem
          key={material.id}
          value={material.id}
          onSelect={() => handleSelectExisting(material)}
        >
          {material.name}
        </CommandItem>
      ))}
    </>
  );

  return (
    <>
      <Input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        readOnly={isMobile}
        value={query}
        onChange={
          isMobile ? undefined : (e) => handleInputChange(e.target.value)
        }
        onFocus={handleFieldFocus}
        className={cn("h-12 px-3.5 text-[15px] md:h-11 md:text-sm", className)}
      />
      {isMobile ? (
        <Dialog open={open} onOpenChange={handleSheetOpenChange}>
          {/*
           * `DialogContent`'s default enter/exit animation (inherited from
           * `components/ui/dialog.tsx`) fades opacity in from 0 and scales up
           * from 95% over the transition. For a bottom sheet that reads as a
           * momentary "double exposure" — the semi-transparent, slightly
           * undersized panel lets the page behind it show through, and its
           * option rows visually overlap the form fields at the same screen
           * position until the transition settles a beat later. `fade-in-100`
           * / `zoom-in-100` (and the `-out` equivalents) pin opacity/scale at
           * their settled values for the whole transition, so the panel is
           * fully opaque and full-size for every frame.
           *
           * A translate-based `slide-in-from-bottom` / `slide-out-to-bottom`
           * replacement was tried too, but it made Base UI's dialog dismiss
           * itself ~100ms after opening in a real browser (verified via
           * Playwright, not reproducible in the jsdom test suite) — most
           * likely an interaction between that keyframe and the dialog's
           * open-animation-completion detection. Sticking to the fade/zoom
           * pins alone avoids that regression while still fixing the
           * reported overlap.
           */}
          <DialogContent
            className="top-auto bottom-0 left-0 h-[85dvh] max-h-[85svh] w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-b-none rounded-t-2xl p-0 sm:max-w-full fade-in-100 zoom-in-100 fade-out-100 zoom-out-100"
            showCloseButton
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{placeholder || "Selecionar material"}</DialogTitle>
            </DialogHeader>
            <Command shouldFilter={false} className="flex h-full min-h-0 flex-col">
              <CommandInput
                autoFocus
                placeholder={placeholder}
                value={query}
                onValueChange={handleInputChange}
              />
              <CommandList className="max-h-none flex-1">
                {optionRows}
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverContent
            anchor={inputRef}
            align="start"
            sideOffset={4}
            initialFocus={false}
            finalFocus={false}
            className="w-(--anchor-width) p-0"
          >
            <Command shouldFilter={false}>
              <CommandList>{optionRows}</CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
