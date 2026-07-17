import { notFound } from "next/navigation";
import { PrintButton } from "@/components/loads/print-button";
import { getLoadItemQrCodes } from "@/lib/qrcode/generate";

export const dynamic = "force-dynamic";

export default async function LoadPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const qrCodes = await getLoadItemQrCodes(id);

  if (qrCodes.length === 0) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <PrintButton />
      <div className="grid grid-cols-2 gap-6 print:grid-cols-3 print:gap-4">
        {qrCodes.map((qr) => (
          <div
            key={qr.itemId}
            className="flex flex-col items-center gap-2 break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.dataUrl}
              alt={qr.payload.identifier}
              className="w-full max-w-48"
            />
            <span className="text-center text-sm font-medium">
              {qr.payload.identifier}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
