import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import { NAV_ITEMS } from "@/lib/nav/nav-items";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
      <nav className="flex items-center gap-4">
        <Link href="/" className="text-sm font-semibold">
          Controle de Estoque de Pátio
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Sair
        </Button>
      </form>
    </header>
  );
}
