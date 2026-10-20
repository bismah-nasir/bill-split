"use client";

import Link from "next/link";

import { NavLink } from "./nav-link";
import { NAV_ITEMS } from "./nav-items";
import { PageContainer } from "./page-container";
import { UserMenu } from "./user-menu";

/**
 * Signed-in chrome: a sticky header (logo, desktop nav, user menu) and, below `md`,
 * a fixed bottom tab bar. Content gets bottom padding so it clears the tab bar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header data-print="hide" className="sticky top-0 z-20 border-b border-line bg-surface">
        <PageContainer className="flex items-center gap-16 py-8">
          <Link href="/dashboard" className="type-h3 text-primary">
            BillSplit
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-4 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} variant="inline" />
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 justify-end">
            <UserMenu />
          </div>
        </PageContainer>
      </header>

      <main className="flex-1 pt-24 pb-96 md:pb-48">
        <PageContainer>{children}</PageContainer>
      </main>

      <nav
        aria-label="Main"
        data-print="hide"
        className="fixed inset-x-0 bottom-0 z-20 flex h-tab-bar border-t border-line bg-surface shadow-raised md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} variant="tab" />
        ))}
      </nav>
    </div>
  );
}
