import { House, Mail, ReceiptText, TrendingUp, type LucideIcon } from "lucide-react";

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
  { href: "/trips", label: "Bills", icon: ReceiptText },
  { href: "/price-history", label: "Prices", icon: TrendingUp },
  { href: "/invitations", label: "Invites", icon: Mail, badge: "pendingInvitations" },
];
