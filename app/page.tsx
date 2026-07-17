import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Controle de Estoque de Pátio</h1>
      <p className="text-muted-foreground">Aplicação em construção.</p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}
