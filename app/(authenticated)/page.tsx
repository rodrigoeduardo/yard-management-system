import Link from "next/link";
import { HOME_ENTRY_POINTS } from "@/lib/home/entry-points";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-2xl font-semibold">Controle de Estoque de Pátio</h1>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {HOME_ENTRY_POINTS.map((entryPoint) => (
          <Link
            key={entryPoint.href}
            href={entryPoint.href}
            className="flex flex-col gap-2 rounded-lg border border-border p-6 text-center transition-colors hover:bg-accent"
          >
            <span className="font-semibold">{entryPoint.label}</span>
            <span className="text-sm text-muted-foreground">{entryPoint.description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
