import { cookies } from "next/headers";

import { Header } from "@/components/nav/header";
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

  return (
    <>
      <Header initials={initials} />
      <main className="pb-20 md:pb-0 print:pb-0">{children}</main>
    </>
  );
}
