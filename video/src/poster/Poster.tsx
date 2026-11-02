import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Logo } from "./Logo";
import { bodyFont, colors, headingFont, links } from "./theme";

const shot = (name: string) => staticFile(`poster/screenshots/${name}.png`);

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: "10px 22px",
        borderRadius: 999,
        background: colors.primarySoft,
        color: colors.primary,
        fontSize: 24,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

/** Light browser window chrome, as in the demo video. */
function BrowserFrame({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        background: colors.surface,
        border: `1.5px solid ${colors.line}`,
        boxShadow: `0 40px 110px ${colors.shadow}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px",
          flexShrink: 0,
          background: "#eef1f0",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 620,
            height: 32,
            borderRadius: 8,
            background: colors.surface,
            color: colors.muted,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          {links.live}
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

/** Thumbnail shown before the demo video plays. */
export function BillSplitPoster() {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: bodyFont, color: colors.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at 85% 5%, rgba(15,118,110,0.14), transparent 70%),
            radial-gradient(800px 600px at 5% 100%, rgba(15,118,110,0.08), transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 0 0 120px" }}>
        <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 34, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Logo size={110} />
            <div
              style={{ fontFamily: headingFont, fontSize: 112, fontWeight: 700, letterSpacing: -3, color: colors.primary }}
            >
              BillSplit
            </div>
          </div>
          <div style={{ fontFamily: headingFont, fontSize: 52, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1 }}>
            Split every bill <span style={{ color: colors.primary }}>by item</span>, down to the paisa
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Chip>Item-level splits</Chip>
            <Chip>Private sharing</Chip>
            <Chip>Price history</Chip>
          </div>
          <div style={{ fontSize: 26, color: colors.muted }}>{links.live}</div>
        </div>

        <div style={{ position: "relative", flex: 1, height: "100%" }}>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 150,
              transform: "perspective(2200px) rotateY(-14deg) rotateX(4deg)",
              transformOrigin: "left center",
            }}
          >
            <BrowserFrame width={1180} height={680}>
              <Img
                src={shot("dashboard")}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              />
            </BrowserFrame>
          </div>
          {/* Phone with the split summary card */}
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 470,
              width: 330,
              height: 560,
              borderRadius: 46,
              overflow: "hidden",
              border: `10px solid ${colors.ink}`,
              background: colors.bg,
              boxShadow: `0 40px 100px ${colors.shadow}`,
            }}
          >
            <Img
              src={shot("bill-split-mobile")}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
