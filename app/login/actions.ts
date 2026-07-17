"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginCredentialsSchema } from "@/lib/auth/credentials-schema";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

export async function login(formData: FormData): Promise<void> {
  const parsed = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_input");
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
