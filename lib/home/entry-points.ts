export interface HomeEntryPoint {
  href: string;
  label: string;
  description: string;
}

export const HOME_ENTRY_POINTS: HomeEntryPoint[] = [
  {
    href: "/loads/new",
    label: "Adicionar Carga",
    description: "Registrar a entrada de uma nova carga por Nota Fiscal.",
  },
  {
    href: "/removals/new",
    label: "Nova Remoção",
    description: "Registrar a retirada de itens do estoque via leitura de QR Code.",
  },
  {
    href: "/inventory",
    label: "Ver Estoque",
    description: "Consultar o estoque atual e o histórico de remoções.",
  },
];
