import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { TopNav } from "@/components/nav/top-nav";

/**
 * Responsive app chrome: a fixed bottom tab bar on mobile, a top-nav on
 * desktop (`md:` and up). Both highlight the active section.
 *
 * `isViewer` (issue #314) is computed server-side in the authenticated
 * layout and passed straight through to both nav surfaces.
 */
export function Header({
  initials,
  isViewer = false,
}: {
  initials: string;
  isViewer?: boolean;
}) {
  return (
    <>
      <TopNav initials={initials} isViewer={isViewer} />
      <BottomTabBar isViewer={isViewer} />
    </>
  );
}
