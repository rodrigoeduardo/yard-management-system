import { cookies } from "next/headers";

import { Header } from "@/components/nav/header";
import { getCurrentUserRole } from "@/lib/auth/current-role";
import { getUserInitials } from "@/lib/auth/user-initials";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initials = getUserInitials(user);
  const role = await getCurrentUserRole();
  const isViewer = role === "viewer";

  return (
    <>
      <Header initials={initials} isViewer={isViewer} />
      <main className="pb-20 md:pb-0 print:pb-0">{children}</main>
    </>
  );
}
