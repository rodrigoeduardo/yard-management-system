import type { Dictionary } from "./pt-BR";

/**
 * `satisfies Dictionary` keeps this locale's key shape in lockstep with the
 * pt-BR source of truth — a missing or extra key fails the type check.
 */
const dictionary = {
  login: {
    heading: "Sign in",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    submit: "Sign in",
    noAccount: "Don't have an account?",
    createAccount: "Create account",
    errors: {
      invalidInput: "Enter a valid email and password.",
      invalidCredentials: "Invalid email or password.",
    },
  },
} satisfies Dictionary;

export default dictionary;
