export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/inventory", label: "Estoque" },
  { href: "/loads/new", label: "Nova Carga" },
  { href: "/removals/new", label: "Nova Remoção" },
];
