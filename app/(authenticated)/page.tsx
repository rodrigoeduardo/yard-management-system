import { cookies } from "next/headers";

import { ActionCards } from "@/components/home/action-cards";
import { DashboardStats } from "@/components/home/dashboard-stats";
import { GreetingHeader } from "@/components/home/greeting-header";
import { LastMovementCard } from "@/components/home/last-movement-card";
import { MobileHomeHeader } from "@/components/home/mobile-header";
import { getUserDisplayName } from "@/lib/auth/user-display-name";
import { getDashboardStats, getLastLoad, getLastRemoval } from "@/lib/db/dashboard";
import { formatYardDate } from "@/lib/format/datetime";
import { getGreeting } from "@/lib/home/greeting";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "@/lib/ui/page-container";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, lastRemoval, lastLoad] = await Promise.all([
    getDashboardStats(),
    getLastRemoval(),
    getLastLoad(),
  ]);

  const now = new Date();
  const greeting = getGreeting(now);
  const displayName = getUserDisplayName(user);
  const dateLabel = formatYardDate(now);

  return (
    <main
      className={cn(
        "flex flex-col gap-6 px-5 py-6 pb-24 md:gap-7 md:py-9 md:pb-9",
        PAGE_CONTAINER_DESKTOP_CLASS,
      )}
    >
      <MobileHomeHeader />
      <GreetingHeader greeting={greeting} displayName={displayName} dateLabel={dateLabel} />

      <DashboardStats
        activeLoads={stats.activeLoads}
        itemsInStock={stats.itemsInStock}
        remainingWeight={stats.remainingWeight}
      />

      <ActionCards />

      <LastMovementCard
        removal={
          lastRemoval && {
            driver: lastRemoval.driver,
            exitDate: lastRemoval.exitDate,
            itemCount: lastRemoval.itemCount,
            totalRemovedWeight: lastRemoval.totalRemovedWeight,
            notasFiscais: lastRemoval.notasFiscais,
          }
        }
        load={
          lastLoad && {
            notaFiscal: lastLoad.notaFiscal,
            material: lastLoad.material,
            entryDate: lastLoad.entryDate,
            nfWeight: lastLoad.nfWeight,
          }
        }
      />
    </main>
  );
}
