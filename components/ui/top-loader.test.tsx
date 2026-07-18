import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TopLoader, useTopLoaderTask } from "./top-loader";

/**
 * Test harness that reports an active task into the shared top-loader store
 * via the same public hook the Link/form reporters use, so the wiring
 * (pending -> store -> bar) is exercised for real (no mocked hooks).
 */
function TaskHarness({ active }: { active: boolean }) {
  useTopLoaderTask(active);
  return null;
}

describe("TopLoader", () => {
  it("renders nothing when idle", () => {
    render(<TopLoader />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows an indeterminate progress bar while a task is active", () => {
    render(
      <>
        <TopLoader />
        <TaskHarness active />
      </>,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-busy", "true");
    // Indeterminate: no concrete aria-valuenow reported.
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("hides the bar again once the task becomes inactive", () => {
    const { rerender } = render(
      <>
        <TopLoader />
        <TaskHarness active />
      </>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(
      <>
        <TopLoader />
        <TaskHarness active={false} />
      </>,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("stays visible until every concurrent task finishes", () => {
    const { rerender } = render(
      <>
        <TopLoader />
        <TaskHarness active />
        <TaskHarness active />
      </>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // One of two tasks ends -> still loading.
    rerender(
      <>
        <TopLoader />
        <TaskHarness active />
        <TaskHarness active={false} />
      </>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Last task ends -> hidden.
    rerender(
      <>
        <TopLoader />
        <TaskHarness active={false} />
        <TaskHarness active={false} />
      </>,
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
