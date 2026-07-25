import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PedidoImageAttach } from "./pedido-image-attach";

function pngFile(name = "pedido.png"): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
}

beforeEach(() => {
  // jsdom has no real object URL implementation.
  URL.createObjectURL = vi.fn(() => "blob:mock-pedido-image");
  URL.revokeObjectURL = vi.fn();
});

describe("PedidoImageAttach — no image attached", () => {
  it("renders a file input restricted to images", () => {
    render(<PedidoImageAttach file={null} onSelect={vi.fn()} />);

    const input = screen.getByTestId("pedido-image-input");
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("calls onSelect with the chosen file", () => {
    const onSelect = vi.fn();
    render(<PedidoImageAttach file={null} onSelect={onSelect} />);

    const input = screen.getByTestId("pedido-image-input");
    const file = pngFile();
    fireEvent.change(input, { target: { files: [file] } });

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("shows no preview image", () => {
    render(<PedidoImageAttach file={null} onSelect={vi.fn()} />);

    expect(
      screen.queryByAltText("Pré-visualização do Pedido"),
    ).not.toBeInTheDocument();
  });
});

describe("PedidoImageAttach — image attached", () => {
  it("shows a preview of the attached image", () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    const preview = screen.getByAltText("Pré-visualização do Pedido");
    expect(preview).toHaveAttribute("src", "blob:mock-pedido-image");
  });

  it("shows a Trocar imagem control that still lets a new file be chosen", () => {
    const onSelect = vi.fn();
    render(<PedidoImageAttach file={pngFile()} onSelect={onSelect} />);

    expect(
      screen.getByRole("button", { name: "Trocar imagem" }),
    ).toBeInTheDocument();

    const input = screen.getByTestId("pedido-image-input");
    const newFile = pngFile("novo-pedido.png");
    fireEvent.change(input, { target: { files: [newFile] } });

    expect(onSelect).toHaveBeenCalledWith(newFile);
  });

  it("opens a zoom dialog with the full-size image when Ampliar is clicked", async () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Ampliar imagem" }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByAltText("Pré-visualização do Pedido"),
    ).toBeInTheDocument();
  });
});

describe("PedidoImageAttach — validation error", () => {
  it("shows the provided error message", () => {
    render(
      <PedidoImageAttach
        file={null}
        onSelect={vi.fn()}
        error="Anexe a imagem do Pedido."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Anexe a imagem do Pedido.",
    );
  });
});
