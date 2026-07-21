import { NewLoadForm } from "@/components/loads/new-load-form";
import { listMaterials } from "@/lib/db/materials";

export const dynamic = "force-dynamic";

export default async function NewLoadPage() {
  const materials = await listMaterials();

  return <NewLoadForm materials={materials} />;
}
