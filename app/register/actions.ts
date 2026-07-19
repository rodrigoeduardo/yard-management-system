"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerCredentialsSchema } from "@/lib/auth/credentials-schema";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Constant-time invite-code check. Compares against the expected code even
 * on a length mismatch so a wrong-length guess doesn't short-circuit before
 * the timing-safe comparison runs, which would leak the expected length.
 */
function isValidInviteCode(candidate: string): boolean {
  const expected = Buffer.from(requireEnv("REGISTER_INVITE_CODE"));
  const provided = Buffer.from(candidate);

  if (expected.length !== provided.length) {
    timingSafeEqual(expected, expected);
    return false;
  }

  return timingSafeEqual(expected, provided);
}

export async function register(formData: FormData): Promise<void> {
  const parsed = registerCredentialsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid_input");
  }

  if (!isValidInviteCode(parsed.data.inviteCode)) {
    redirect("/register?error=invalid_code");
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.name },
    },
  });

  if (error) {
    redirect("/register?error=signup_failed");
  }

  if (!data.session) {
    redirect("/register?success=confirm_email");
  }

  redirect("/");
}
