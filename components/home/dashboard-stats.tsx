import { StatCard } from "@/components/ui/stat-card";

interface DashboardStatsProps {
  activeLoads: number;
  itemsInStock: number;
  remainingWeight: string;
}

/**
 * The three home-dashboard stat cards: cargas ativas, itens no pátio, and
 * peso restante. Always three columns, per the design's mobile and
 * desktop frames alike — only the gap and card sizing change at `md:`.
 */
export function DashboardStats({
  activeLoads,
  itemsInStock,
  remainingWeight,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-[10px] md:gap-4">
      <StatCard value={activeLoads} label="Cargas Ativas" />
      <StatCard value={itemsInStock} label="Itens no Pátio" />
      <StatCard value={`${remainingWeight} t`} label="Peso Restante" />
    </div>
  );
}
