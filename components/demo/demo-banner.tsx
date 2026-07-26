"use client";

import { usePathname } from "next/navigation";

import { isQrPrintRoute } from "@/lib/loads/print";
import { isReceiptPrintRoute } from "@/lib/removals/print";

/**
 * Persistent PT-BR notice shown on every page while `DEMO_MODE` is set
 * (ADR 0002): visitors share one dataset that resets nightly. Never
 * rendered when demo mode is off, and deliberately excluded from the QR
 * codes print route (#252) and the removal receipt print route (#270) so
 * the printed output stays clean.
 */
export function DemoBanner({
  demoMode,
  contactUrl,
}: {
  demoMode: boolean;
  contactUrl?: string;
}) {
  const pathname = usePathname();

  if (!demoMode || isQrPrintRoute(pathname) || isReceiptPrintRoute(pathname)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-accent px-4 py-2 text-center text-[13px] font-medium text-accent-foreground print:hidden">
      <span>
        Este é um ambiente de demonstração: os dados são compartilhados entre visitantes e
        reiniciados todas as noites.
      </span>
      {contactUrl ? (
        <a href={contactUrl} className="font-semibold underline underline-offset-2">
          Fale conosco
        </a>
      ) : null}
    </div>
  );
}
