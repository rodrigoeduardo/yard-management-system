import { MaterialsView } from "@/components/materials/materials-view";
import { getCurrentUserRole } from "@/lib/auth/current-role";
import { getMaterialsWithInStockCounts } from "@/lib/db/materials";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "@/lib/ui/page-container";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [materials, role] = await Promise.all([
    getMaterialsWithInStockCounts(),
    getCurrentUserRole(),
  ]);

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:py-8",
        PAGE_CONTAINER_DESKTOP_CLASS,
      )}
    >
      <h1 className="text-2xl font-semibold">Materiais</h1>
      <MaterialsView materials={materials} isViewer={role === "viewer"} />
    </main>
  );
}
