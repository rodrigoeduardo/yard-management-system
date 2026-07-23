import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import { DemoBanner } from "./demo-banner";

describe("DemoBanner", () => {
  it("renders the PT-BR demo notice with the contact CTA when demo mode is on and a URL is configured", () => {
    usePathname.mockReturnValue("/");
    render(<DemoBanner demoMode contactUrl="https://example.com/contact" />);

    expect(screen.getByText(/ambiente de demonstra/i)).toBeInTheDocument();
    expect(screen.getByText(/dados.*compartilhados/i)).toBeInTheDocument();
    expect(screen.getByText(/reiniciados.*noite|todas as noites/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /fale conosco/i });
    expect(link).toHaveAttribute("href", "https://example.com/contact");
  });

  it("renders the banner without a link when demo mode is on but no contact URL is configured", () => {
    usePathname.mockReturnValue("/");
    render(<DemoBanner demoMode contactUrl={undefined} />);

    expect(screen.getByText(/ambiente de demonstra/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /fale conosco/i })).not.toBeInTheDocument();
  });

  it("renders nothing when demo mode is off", () => {
    usePathname.mockReturnValue("/");
    const { container } = render(<DemoBanner demoMode={false} contactUrl="https://example.com/contact" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on the QR print route even when demo mode is on", () => {
    usePathname.mockReturnValue("/loads/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a/print");
    const { container } = render(<DemoBanner demoMode contactUrl="https://example.com/contact" />);

    expect(container).toBeEmptyDOMElement();
  });
});
