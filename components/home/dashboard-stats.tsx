import { StatCard } from "@/components/ui/stat-card";

interface DashboardStatsProps {
  activeLoads: number;
  materialsInStock: number;
  remainingWeight: string;
}

/**
 * The three home-dashboard stat cards: cargas ativas, materiais no pátio,
 * and peso restante. Always three columns, per the design's mobile and
 * desktop frames alike — only the gap and card sizing change at `md:`.
 * Cargas Ativas and Materiais no Pátio are links to their detail pages
 * (Estoque and Materiais); Peso Restante stays a plain, non-clickable card.
 */
export function DashboardStats({
  activeLoads,
  materialsInStock,
  remainingWeight,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-[10px] md:gap-4">
      <StatCard value={activeLoads} label="Cargas Ativas" href="/inventory" />
      <StatCard
        value={materialsInStock}
        label="Materiais no Pátio"
        href="/materials"
      />
      <StatCard value={`${remainingWeight} t`} label="Peso Restante" />
    </div>
  );
}
