import { PackageMinus, PackagePlus, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HomeEntryPoint {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const HOME_ENTRY_POINTS: HomeEntryPoint[] = [
  {
    href: "/loads/new",
    label: "Entrada",
    description: "Registrar a entrada de uma nova carga por Nota Fiscal.",
    icon: PackagePlus,
  },
  {
    href: "/removals/new",
    label: "Saída",
    description: "Registrar a saída de itens do estoque via leitura de QR Code.",
    icon: PackageMinus,
  },
  {
    href: "/inventory",
    label: "Ver Estoque",
    description: "Consultar o estoque atual e o histórico de remoções.",
    icon: Warehouse,
  },
];
