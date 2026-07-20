import Link from "next/link";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormLoaderReporter } from "@/components/ui/top-loader";
import { register } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Preencha nome, e-mail, senha e código de convite.",
  invalid_code: "Código de convite inválido.",
  signup_failed: "Não foi possível criar a conta. Tente novamente.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  confirm_email: "Conta criada! Confirme seu e-mail para poder entrar.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const successMessage = success ? SUCCESS_MESSAGES[success] : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <form action={register} className="flex w-full max-w-sm flex-col gap-4">
        <FormLoaderReporter />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Seu nome completo"
          />
        </div>
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
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inviteCode" className="text-sm font-medium">
            Código de convite
          </label>
          <Input
            id="inviteCode"
            name="inviteCode"
            type="text"
            required
            autoComplete="off"
            placeholder="Código fornecido pelo administrador"
          />
        </div>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="text-sm text-emerald-600">
            {successMessage}
          </p>
        )}
        <SubmitButton>Criar conta</SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        Já possui uma conta?{" "}
        <Link href="/login" className="underline">
          Faça login.
        </Link>
      </p>
    </main>
  );
}
