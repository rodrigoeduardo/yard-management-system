import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrintPageStyle } from "./print-page-style";

const LABEL_CSS = "@media print { @page { size: 100mm 50mm; margin: 0; } }";
const RECEIPT_CSS = "@media print { @page { size: A4; margin: 15mm; } }";

function printPageStyleTags() {
  return Array.from(
    document.head.querySelectorAll("style[data-print-page-style]"),
  );
}

describe("PrintPageStyle (issue #286 soft-navigation leak)", () => {
  it("injects the given @page rule as a real <style> element in <head> on mount", () => {
    const { unmount } = render(<PrintPageStyle css={LABEL_CSS} />);

    const tags = printPageStyleTags();
    expect(tags).toHaveLength(1);
    expect(tags[0].textContent).toBe(LABEL_CSS);

    unmount();
  });

  it("removes its <style> element from <head> on unmount", () => {
    const { unmount } = render(<PrintPageStyle css={LABEL_CSS} />);
    expect(printPageStyleTags()).toHaveLength(1);

    unmount();

    expect(printPageStyleTags()).toHaveLength(0);
  });

  it("does not leak the label @page rule into a route soft-navigated to afterwards", () => {
    // Simulates the real user path: visit the QR label print route (mounts
    // with the 100x50mm rule), then soft-navigate away via PageBackHeader's
    // next/link back control (unmounting this route's tree) to a route that
    // renders no PrintPageStyle at all, e.g. /inventory. A CSS Module's
    // <link rel="stylesheet" precedence="next"> is a React 19 hoistable
    // resource whose deletion effect never removes the node from <head> on
    // unmount, so its @page rule would stay live app-wide. A directly
    // inserted <style> is a plain DOM node, so it must actually be gone.
    const { unmount } = render(<PrintPageStyle css={LABEL_CSS} />);
    unmount();

    expect(printPageStyleTags()).toHaveLength(0);
    expect(document.head.innerHTML).not.toMatch(/100mm 50mm/);
  });

  it("does not let a stale label rule win once the receipt route is mounted after it", () => {
    // Label route mounts first, then the user soft-navigates to the
    // receipt route. Only the receipt's A4 rule must be live afterward —
    // this is the "receipt printed at 100x50mm again" leak from #286.
    const { unmount: unmountLabel } = render(
      <PrintPageStyle css={LABEL_CSS} />,
    );
    unmountLabel();
    const { unmount: unmountReceipt } = render(
      <PrintPageStyle css={RECEIPT_CSS} />,
    );

    const tags = printPageStyleTags();
    expect(tags).toHaveLength(1);
    expect(tags[0].textContent).toBe(RECEIPT_CSS);
    expect(document.head.innerHTML).not.toMatch(/100mm 50mm/);

    unmountReceipt();
  });
});
