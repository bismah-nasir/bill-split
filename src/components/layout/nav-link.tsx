"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";

import type { NavItem } from "./nav-items";
import { PendingInvitationsBadge } from "./pending-invitations-badge";

const navLinkVariants = cva(
  "flex items-center transition-colors duration-fast ease-standard aria-[current=page]:text-primary",
  {
    variants: {
      variant: {
        /** Desktop header link. */
        inline:
          "h-control-sm gap-8 rounded-pill px-16 type-button-sm text-ink-secondary hover:bg-surface-subtle aria-[current=page]:bg-primary-soft",
        /** Mobile bottom-bar tab: icon above a short label. */
        tab: "min-h-tap flex-1 flex-col justify-center gap-2 py-6 type-caption text-ink-muted",
      },
    },
  },
);

type NavLinkProps = { item: NavItem; variant: "inline" | "tab" };

export function NavLink({ item, variant }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={navLinkVariants({ variant })}
    >
      {variant === "tab" ? (
        <span className="relative">
          <Icon aria-hidden className="size-icon-xl" />
          {item.badge && <PendingInvitationsBadge className="absolute -top-6 left-12" />}
        </span>
      ) : (
        <Icon aria-hidden className="size-icon-md" />
      )}
      {item.label}
      {variant === "inline" && item.badge && <PendingInvitationsBadge />}
    </Link>
  );
}
