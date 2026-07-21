"use client";

import { useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MaterialOption = { id: string; name: string };

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

  const trimmedQuery = query.trim();
  const filtered = useMemo(
    () => filterMaterials(materials, trimmedQuery),
    [materials, trimmedQuery],
  );
  const showCreateOption = trimmedQuery !== "";

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        className={cn("h-12 px-3.5 text-[15px] md:h-11 md:text-sm", className)}
      />
      <PopoverContent
        anchor={inputRef}
        align="start"
        sideOffset={4}
        initialFocus={false}
        finalFocus={false}
        className="w-(--anchor-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandList>
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
