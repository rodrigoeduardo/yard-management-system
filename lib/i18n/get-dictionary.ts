import type { Locale } from "./locale";
import type { Dictionary } from "./dictionaries/pt-BR";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  "pt-BR": () => import("./dictionaries/pt-BR").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
