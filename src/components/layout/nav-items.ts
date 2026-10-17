import { House, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Main navigation. Each entry is added in the phase that ships its page. */
export const NAV_ITEMS: NavItem[] = [{ href: "/dashboard", label: "Home", icon: House }];
