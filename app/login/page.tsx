import { Button } from "@/components/ui/button";
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
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
