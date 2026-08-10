import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/login/actions", () => ({ logout: vi.fn() }));

import { Header } from "./header";

describe("Header", () => {
  it("renders both the mobile bottom tab bar and the desktop top-nav", () => {
    render(<Header initials="RS" />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("hides Entrada/Saída in both nav surfaces for a viewer session (issue #314)", () => {
    render(<Header initials="RS" isViewer />);

    expect(screen.queryByRole("link", { name: "Entrada" })).not.toBeInTheDocument();
    expect(screen.queryAllByText("Saída")).toHaveLength(0);
  });
});
