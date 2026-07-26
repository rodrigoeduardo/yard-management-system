import Link from "next/link";
import { BrandLogo } from "@/components/nav/brand-logo";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormLoaderReporter } from "@/components/ui/top-loader";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { createTranslator } from "@/lib/i18n/translator";
import { login } from "./actions";

/**
 * This page is the #277 migration proof: every user-facing string comes
 * from the i18n dictionaries (`lib/i18n/dictionaries/`) via `t()` instead of
 * being hardcoded here. `BrandLogo`'s "Pátio" wordmark is intentionally
 * unmigrated — it's a shared component used outside this page too, so it's
 * listed as a follow-up rather than pulled into this diff.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const t = createTranslator(dictionary);

  const ERROR_KEYS = {
    invalid_input: "login.errors.invalidInput",
    invalid_credentials: "login.errors.invalidCredentials",
  } as const;
  const errorMessage =
    error && error in ERROR_KEYS
      ? t(ERROR_KEYS[error as keyof typeof ERROR_KEYS])
      : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <BrandLogo />
      <h1 className="text-2xl font-semibold">{t("login.heading")}</h1>
      <form action={login} className="flex w-full max-w-sm flex-col gap-4">
        <FormLoaderReporter />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            {t("login.emailLabel")}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            {t("login.passwordLabel")}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t("login.passwordPlaceholder")}
          />
        </div>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <SubmitButton>{t("login.submit")}</SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="underline">
          {t("login.createAccount")}
        </Link>
      </p>
    </main>
  );
}
