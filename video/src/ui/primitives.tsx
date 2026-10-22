import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { ChevronDown, FileText, Home, Mail, TrendingUp, type LucideIcon } from "lucide-react";

import { C, FONT_HEADING, RADIUS, SHADOW, T } from "../theme";

/** Shrinks briefly when "clicked" at `clickFrame`, like a real press. */
export function usePress(clickFrame?: number) {
  const frame = useCurrentFrame();
  if (clickFrame === undefined) return 1;
  const d = frame - clickFrame;
  if (d < -3 || d > 6) return 1;
  return d < 0 ? 1 - (d + 3) * 0.015 : 0.955 + d * 0.0075;
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: C.surface, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, ...style }}>{children}</div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger-soft";
type ButtonSize = "lg" | "md" | "sm";

const BUTTON_SIZE: Record<ButtonSize, CSSProperties> = {
  lg: { height: 48, padding: "0 28px", ...T.button },
  md: { height: 44, padding: "0 24px", ...T.buttonSm },
  sm: { height: 36, padding: "0 16px", ...T.buttonSm },
};

const BUTTON_VARIANT: Record<ButtonVariant, CSSProperties> = {
  primary: { background: C.primary, color: C.inkInverse, boxShadow: SHADOW.floating },
  secondary: { background: C.surface, color: C.ink, border: `1px solid ${C.lineControl}` },
  ghost: { background: "transparent", color: C.ink },
  "danger-soft": { background: C.errorSoft, color: C.error, border: `1px solid ${C.error}` },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  clickAt,
  style,
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  clickAt?: number;
  style?: CSSProperties;
}) {
  const scale = usePress(clickAt);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: RADIUS.pill,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        flexShrink: 0,
        transform: `scale(${scale})`,
        ...BUTTON_SIZE[size],
        ...BUTTON_VARIANT[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </div>
  );
}

type BadgeTone = "neutral" | "primary" | "warning" | "success";
const BADGE_TONE: Record<BadgeTone, CSSProperties> = {
  neutral: { background: C.surfaceMuted, color: C.inkSecondary },
  primary: { background: C.primarySoft, color: C.primary },
  warning: { background: C.warningSoft, color: C.warning },
  success: { background: C.successSoft, color: C.success },
};

export function Badge({ children, tone = "neutral", style }: { children: ReactNode; tone?: BadgeTone; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: RADIUS.pill,
        whiteSpace: "nowrap",
        ...T.caption,
        fontSize: 13,
        ...BADGE_TONE[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Blinking text caret for the focused field. */
export function Caret() {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 1.5,
        height: 20,
        marginLeft: 1,
        background: on ? C.ink : "transparent",
        verticalAlign: "middle",
      }}
    />
  );
}

export function Input({
  value,
  placeholder,
  focused,
  prefix,
  masked,
  trailing,
  leading,
  style,
  height = 44,
}: {
  value?: string;
  placeholder?: string;
  focused?: boolean;
  prefix?: string;
  masked?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
  style?: CSSProperties;
  height?: number;
}) {
  const shown = masked && value ? "•".repeat(value.length) : value;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height,
        boxSizing: "border-box",
        padding: "0 14px",
        borderRadius: RADIUS.md,
        background: C.surface,
        border: `1px solid ${focused ? C.primary : C.lineControl}`,
        boxShadow: focused ? `0 0 0 3px ${C.primarySoft}` : "none",
        ...T.body,
        color: C.ink,
        ...style,
      }}
    >
      {leading}
      {prefix && <span style={{ color: C.inkMuted }}>{prefix}</span>}
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
        {shown ? shown : !focused && <span style={{ color: C.inkMuted }}>{placeholder}</span>}
        {focused && <Caret />}
      </span>
      {trailing}
    </div>
  );
}

export function Field({
  label,
  hint,
  success,
  children,
  style,
}: {
  label: string;
  hint?: string;
  success?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span style={{ ...T.bodySm, fontWeight: 500, color: C.ink }}>{label}</span>
      {children}
      {success ? (
        <span style={{ ...T.caption, color: C.success }}>✓ {success}</span>
      ) : (
        hint && <span style={{ ...T.caption, color: C.inkMuted }}>{hint}</span>
      )}
    </div>
  );
}

/** Toggle chip used for "who pays" on an item. */
export function Chip({ label, selected, clickAt }: { label: string; selected: boolean; clickAt?: number }) {
  const scale = usePress(clickAt);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 34,
        padding: "0 14px",
        borderRadius: RADIUS.pill,
        border: `1px solid ${selected ? C.primary : C.lineControl}`,
        background: selected ? C.primarySoft : C.surface,
        color: selected ? C.primary : C.ink,
        transform: `scale(${scale})`,
        ...T.buttonSm,
      }}
    >
      {label}
    </span>
  );
}

export function Money({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ fontFamily: FONT_HEADING, fontWeight: 600, fontVariantNumeric: "tabular-nums", ...style }}>
      {children}
    </span>
  );
}

export type NavKey = "home" | "bills" | "prices" | "invites";
const NAV: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "bills", label: "Bills", icon: FileText },
  { key: "prices", label: "Prices", icon: TrendingUp },
  { key: "invites", label: "Invites", icon: Mail },
];

export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: size, color: C.primary, letterSpacing: -0.3 }}>
      BillSplit
    </span>
  );
}

/** Desktop top bar: logo, nav pills, user menu. */
export function DesktopHeader({ active, user = "Ayesha Khan" }: { active?: NavKey; user?: string }) {
  return (
    <div
      style={{
        height: 52,
        background: C.surface,
        borderBottom: `1px solid ${C.line}`,
        display: "flex",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div style={{ width: 720, display: "flex", alignItems: "center", gap: 18 }}>
        <Logo size={19} />
        <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <span
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 14px",
                borderRadius: RADIUS.pill,
                background: active === key ? C.primarySoft : "transparent",
                color: active === key ? C.primary : C.inkSecondary,
                ...T.buttonSm,
              }}
            >
              <Icon size={15} />
              {label}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, ...T.buttonSm, color: C.ink }}>
          {user} <ChevronDown size={16} />
        </span>
      </div>
    </div>
  );
}

export function MobileHeader({ user = "Ayesha Khan" }: { user?: string }) {
  return (
    <div
      style={{
        height: 52,
        background: C.surface,
        borderBottom: `1px solid ${C.line}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <Logo />
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, ...T.buttonSm, color: C.ink }}>
        {user} <ChevronDown size={16} />
      </span>
    </div>
  );
}

export function TabBar({ active, badge }: { active?: NavKey; badge?: number }) {
  return (
    <div
      style={{
        height: 58,
        background: C.surface,
        borderTop: `1px solid ${C.line}`,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        flexShrink: 0,
      }}
    >
      {NAV.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            color: active === key ? C.primary : C.inkMuted,
            ...T.caption,
            fontSize: 12,
            position: "relative",
          }}
        >
          <Icon size={20} />
          {label}
          {key === "invites" && badge ? (
            <span
              style={{
                position: "absolute",
                top: 4,
                left: "56%",
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: C.primary,
                color: C.inkInverse,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h3 style={{ ...T.h3, margin: 0, color: C.ink }}>{children}</h3>
      {action}
    </div>
  );
}
