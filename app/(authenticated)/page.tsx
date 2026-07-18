import { cookies } from "next/headers";

import { ActionCards } from "@/components/home/action-cards";
import { DashboardStats } from "@/components/home/dashboard-stats";
import { GreetingHeader } from "@/components/home/greeting-header";
import { LastRemovalCard } from "@/components/home/last-removal-card";
import { getUserDisplayName } from "@/lib/auth/user-display-name";
import { getDashboardStats, getLastRemoval } from "@/lib/db/dashboard";
import { getGreeting } from "@/lib/home/greeting";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, lastRemoval] = await Promise.all([
    getDashboardStats(),
    getLastRemoval(),
  ]);

  const greeting = getGreeting(new Date());
  const displayName = getUserDisplayName(user?.email);

  return (
    <main className="flex flex-col gap-6 px-4 py-6 pb-24 md:mx-auto md:w-full md:max-w-5xl md:gap-8 md:px-8 md:py-10 md:pb-10">
      <GreetingHeader greeting={greeting} displayName={displayName} />

      <DashboardStats
        activeLoads={stats.activeLoads}
        itemsInStock={stats.itemsInStock}
        remainingWeight={stats.remainingWeight}
      />

      <ActionCards />

      <LastRemovalCard
        removal={
          lastRemoval && {
            driver: lastRemoval.driver,
            exitDate: lastRemoval.exitDate.toLocaleDateString("pt-BR"),
            itemCount: lastRemoval.itemCount,
            totalRemovedWeight: lastRemoval.totalRemovedWeight,
            notasFiscais: lastRemoval.notasFiscais,
          }
        }
      />
    </main>
  );
}
