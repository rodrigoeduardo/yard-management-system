import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageBackHeader } from "./page-back-header";

describe("PageBackHeader", () => {
  it("renders the page title", () => {
    render(<PageBackHeader title="Nova Remoção" href="/" />);

    expect(screen.getByText("Nova Remoção")).toBeInTheDocument();
  });

  it("is hidden at md: and up (desktop shows no back control)", () => {
    const { container } = render(<PageBackHeader title="Nova Remoção" href="/" />);

    expect(container.firstElementChild?.className).toMatch(/\bmd:hidden\b/);
  });

  it("renders a back link to the given href", () => {
    render(<PageBackHeader title="Nova Remoção" href="/" />);

    const back = screen.getByRole("link", { name: "Voltar" });
    expect(back).toHaveAttribute("href", "/");
  });

  it("calls onBack when a callback is given instead of an href", () => {
    const onBack = vi.fn();
    render(<PageBackHeader title="Nova Carga" onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders optional trailing action content", () => {
    render(
      <PageBackHeader
        title="Nova Carga"
        onBack={vi.fn()}
        action={<span>Etapa 1 de 2</span>}
      />,
    );

    expect(screen.getByText("Etapa 1 de 2")).toBeInTheDocument();
  });
});
