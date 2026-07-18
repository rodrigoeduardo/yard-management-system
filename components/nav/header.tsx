import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { TopNav } from "@/components/nav/top-nav";

/**
 * Responsive app chrome: a fixed bottom tab bar on mobile, a top-nav on
 * desktop (`md:` and up). Both highlight the active section.
 */
export function Header({ initials }: { initials: string }) {
  return (
    <>
      <TopNav initials={initials} />
      <BottomTabBar />
    </>
  );
}
