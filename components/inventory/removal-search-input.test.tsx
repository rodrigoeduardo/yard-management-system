import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemovalSearchInput } from "./removal-search-input";

describe("RemovalSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the current search value", () => {
    render(<RemovalSearchInput value="NF-123" onSearch={vi.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveValue("NF-123");
  });

  it("debounces onSearch calls while typing", () => {
    const onSearch = vi.fn();
    render(<RemovalSearchInput value="" onSearch={onSearch} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "N" } });
    fireEvent.change(input, { target: { value: "NF" } });
    fireEvent.change(input, { target: { value: "NF-" } });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("NF-");
  });

  it("does not call onSearch when the value prop changes externally (e.g. back navigation)", () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <RemovalSearchInput value="old" onSearch={onSearch} />,
    );

    rerender(<RemovalSearchInput value="new" onSearch={onSearch} />);
    vi.advanceTimersByTime(300);

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).toHaveValue("new");
  });

  it("keeps a keystroke typed while the previous debounced push is still round-tripping", () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <RemovalSearchInput value="" onSearch={onSearch} />,
    );

    const input = screen.getByRole("searchbox");

    // First push: user types "a" and the debounce fires.
    fireEvent.change(input, { target: { value: "a" } });
    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("a");

    // A further keystroke lands before the navigation triggered by that
    // push has round-tripped back into the `value` prop.
    fireEvent.change(input, { target: { value: "ab" } });

    // The stale echo of the first push now arrives as a new `value` prop.
    rerender(<RemovalSearchInput value="a" onSearch={onSearch} />);

    // The newer keystroke must survive the stale round-trip.
    expect(input).toHaveValue("ab");

    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("ab");
  });
});
