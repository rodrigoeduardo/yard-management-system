/**
 * pt-BR dictionary — the source-of-truth shape every other locale's
 * dictionary must satisfy (see `en.ts`'s `satisfies Dictionary`).
 *
 * Only the login page (issue #277's migration proof) is seeded so far.
 * Remaining pages keep their hardcoded Portuguese strings until extracted
 * in follow-up issues — see the PR notes for #277.
 */
const dictionary = {
  login: {
    heading: "Entrar",
    emailLabel: "E-mail",
    emailPlaceholder: "seu@email.com",
    passwordLabel: "Senha",
    passwordPlaceholder: "••••••••",
    submit: "Entrar",
    noAccount: "Não tem uma conta?",
    createAccount: "Criar conta",
    errors: {
      invalidInput: "Informe um e-mail válido e a senha.",
      invalidCredentials: "E-mail ou senha inválidos.",
    },
  },
};

export type Dictionary = typeof dictionary;

export default dictionary;
