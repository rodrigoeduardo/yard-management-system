import { PackageMinus, PackagePlus, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/lib/auth/current-role";
import { isViewerRestrictedPath } from "@/lib/auth/viewer-restricted-routes";

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

/**
 * Filters out the write-only entry points (Entrada, Saída) for a viewer
 * session (issue #314). Operators see every entry point unchanged.
 */
export function filterHomeEntryPointsForRole(
  entryPoints: HomeEntryPoint[],
  role: AppRole,
): HomeEntryPoint[] {
  if (role !== "viewer") return entryPoints;
  return entryPoints.filter(
    (entryPoint) => !isViewerRestrictedPath(entryPoint.href),
  );
}
