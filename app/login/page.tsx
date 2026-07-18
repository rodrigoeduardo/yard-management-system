import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLoaderReporter } from "@/components/ui/top-loader";
import { login } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Informe um e-mail válido e a senha.",
  invalid_credentials: "E-mail ou senha inválidos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <form action={login} className="flex w-full max-w-sm flex-col gap-4">
        <FormLoaderReporter />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <Button type="submit">Entrar</Button>
      </form>
    </main>
  );
}
