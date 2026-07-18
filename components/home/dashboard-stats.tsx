import { StatCard } from "@/components/ui/stat-card";

interface DashboardStatsProps {
  activeLoads: number;
  itemsInStock: number;
  remainingWeight: string;
}

/**
 * The three home-dashboard stat cards: cargas ativas, itens no pátio, and
 * peso restante. Mobile base is a single column; `md:` lays them out in
 * three columns.
 */
export function DashboardStats({
  activeLoads,
  itemsInStock,
  remainingWeight,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard value={activeLoads} label="Cargas Ativas" />
      <StatCard value={itemsInStock} label="Itens no Pátio" />
      <StatCard value={`${remainingWeight} kg`} label="Peso Restante" />
    </div>
  );
}
