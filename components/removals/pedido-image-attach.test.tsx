import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

describe("PedidoImageAttach — preview interaction", () => {
  it("does not open the zoom dialog when the preview itself is clicked", () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByAltText("Pré-visualização do Pedido"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("scales the preview image while pinching with two touches", () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    const preview = screen.getByAltText("Pré-visualização do Pedido");
    const touchTarget = preview.parentElement!;

    fireEvent.touchStart(touchTarget, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 120, clientY: 100 },
      ],
    });
    fireEvent.touchMove(touchTarget, {
      touches: [
        { clientX: 80, clientY: 100 },
        { clientX: 140, clientY: 100 },
      ],
    });

    expect(preview.style.transform).toContain("scale(3)");
  });

  it("resets zoom on tap after pinching in", () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    const preview = screen.getByAltText("Pré-visualização do Pedido");
    const touchTarget = preview.parentElement!;

    fireEvent.touchStart(touchTarget, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 120, clientY: 100 },
      ],
    });
    fireEvent.touchMove(touchTarget, {
      touches: [
        { clientX: 80, clientY: 100 },
        { clientX: 140, clientY: 100 },
      ],
    });
    expect(preview.style.transform).toContain("scale(3)");

    fireEvent.click(touchTarget);

    expect(preview.style.transform).toContain("scale(1)");
  });
});

describe("PedidoImageAttach — zoom dialog dismissal", () => {
  it("closes the dialog when clicking outside the image but inside the dialog area", async () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Ampliar imagem" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(dialog);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the dialog open when clicking the enlarged image itself", async () => {
    render(<PedidoImageAttach file={pngFile()} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Ampliar imagem" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByAltText("Pré-visualização do Pedido"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
