import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveAppRole } from "@/lib/auth/current-role";
import { isViewerRestrictedPath } from "@/lib/auth/viewer-restricted-routes";

const PUBLIC_PATHS = ["/login", "/register"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`);
  }
  return value;
}

/**
 * DEMO_MODE (off by default — see ADR 0002) switches the deployment into
 * demo behavior: every visitor is transparently signed in as a single
 * seeded demo user and never sees auth UI. All existing auth code paths
 * stay intact; this flag is the only divergence point.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Refreshes the Supabase session cookie and redirects unauthenticated
 * requests to /login. Must run before any protected route renders — the
 * refreshed cookie is what downstream Server Components/Actions read.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = isPublicPath(request.nextUrl.pathname);
  const demoMode = isDemoModeEnabled();

  if (demoMode) {
    // No login/register UI in demo mode — both routes just redirect into
    // the app, regardless of session state.
    if (isPublic) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!user) {
      // First request from a visitor with no session yet: transparently
      // establish one as the seeded demo user. The `cookies.setAll` hook
      // wired above writes the session cookie onto `response`, so this
      // request completes already authenticated — no redirect needed.
      const { error } = await supabase.auth.signInWithPassword({
        email: requireEnv("DEMO_USER_EMAIL"),
        password: requireEnv("DEMO_USER_PASSWORD"),
      });
      if (error) {
        throw new Error(`Demo user sign-in failed: ${error.message}`);
      }
    }

    return response;
  }

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Issue #314: a viewer requesting a write-only route by hand (deep link,
  // typed URL) never reaches the route — same defence-in-depth spirit as the
  // guard in lib/actions/guard.ts, but for rendering instead of writes.
  if (
    user &&
    resolveAppRole(user) === "viewer" &&
    isViewerRestrictedPath(request.nextUrl.pathname)
  ) {
    const redirectUrl = new URL("/inventory", request.url);
    redirectUrl.searchParams.set("notice", "viewer-restricted");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
