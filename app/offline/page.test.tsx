import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OfflinePage from "./page";

describe("OfflinePage", () => {
  it("tells the user they are offline, in Portuguese", () => {
    render(<OfflinePage />);

    expect(screen.getByRole("heading", { name: /você está offline/i })).toBeInTheDocument();
  });
});
