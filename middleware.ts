import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // manifest.webmanifest, sw.js and offline (#143) must stay reachable
    // without an auth check: the browser fetches the manifest and service
    // worker before any login happens (e.g. on /login itself), and the
    // offline fallback page must not redirect when the network is down.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
