export function formatItemStatus(status: "in_stock" | "removed"): string {
  return status === "in_stock" ? "Em estoque" : "Removido";
}
