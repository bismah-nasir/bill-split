import { House, Mail, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** A live count shown on the item. */
  badge?: "pendingInvitations";
};

/** Main navigation. Each entry is added in the phase that ships its page. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/invitations", label: "Invites", icon: Mail, badge: "pendingInvitations" },
];
