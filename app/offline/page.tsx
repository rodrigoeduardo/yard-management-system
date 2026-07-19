import { BrandLogo } from "@/components/nav/brand-logo";

/**
 * Offline fallback page (issue #143). Cached by the service worker
 * (public/sw.js) at install time and served for navigation requests when
 * the network is unavailable. No data caching involved — this is the only
 * offline-capable route.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <BrandLogo />
      <h1 className="text-xl font-semibold">Você está offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Verifique sua conexão com a internet e tente novamente.
      </p>
    </main>
  );
}
