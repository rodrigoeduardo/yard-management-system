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
 * Constant-time comparison. Compares against the expected code even on a
 * length mismatch so a wrong-length guess doesn't short-circuit before the
 * timing-safe comparison runs, which would leak the expected length.
 */
function timingSafeEquals(expectedValue: string, candidate: string): boolean {
  const expected = Buffer.from(expectedValue);
  const provided = Buffer.from(candidate);

  if (expected.length !== provided.length) {
    timingSafeEqual(expected, expected);
    return false;
  }

  return timingSafeEqual(expected, provided);
}

type RegistrationRole = "operator" | "viewer";

/**
 * Resolves which role (if any) the submitted invite code grants. The
 * operator code (REGISTER_INVITE_CODE) is always checked; the viewer code
 * (VIEWER_INVITE_CODE) is optional — when unset, the viewer path does not
 * exist at all, so any candidate other than the operator code is invalid,
 * identical to pre-viewer behavior. Both comparisons are constant-time.
 */
function resolveInviteCodeRole(candidate: string): RegistrationRole | null {
  if (timingSafeEquals(requireEnv("REGISTER_INVITE_CODE"), candidate)) {
    return "operator";
  }

  const viewerCode = process.env.VIEWER_INVITE_CODE;
  if (viewerCode && timingSafeEquals(viewerCode, candidate)) {
    return "viewer";
  }

  return null;
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

  const role = resolveInviteCodeRole(parsed.data.inviteCode);
  if (role === null) {
    redirect("/register?error=invalid_code");
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.name,
        ...(role === "viewer" ? { app_role: "viewer" } : {}),
      },
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
