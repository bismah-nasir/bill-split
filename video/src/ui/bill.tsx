import type { CSSProperties } from "react";
import { CircleCheck } from "lucide-react";

import { formatPaisa } from "../anim";
import type { Bill, Item } from "../data";
import { SHARES } from "../data";
import { C, T } from "../theme";
import { Badge, Card, Money } from "./primitives";

/** A bill row as on the dashboard and Bill History. */
export function TripCard({ bill, highlight, style, compact }: { bill: Bill; highlight?: boolean; style?: CSSProperties; compact?: boolean }) {
  return (
    <Card
      style={{
        padding: compact ? "16px 20px" : "20px 20px",
        display: "flex",
        justifyContent: "space-between",
        background: highlight ? C.surfaceSubtle : C.surface,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...T.h3, color: C.ink }}>{bill.title}</span>
        <span style={{ ...T.bodySm, fontSize: 15, color: C.inkSecondary }}>
          {bill.store} · {bill.date}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <Badge>{bill.category}</Badge>
          <Badge tone="primary">Owned</Badge>
          <span style={{ ...T.caption, fontSize: 13, color: C.inkMuted }}>{bill.people}</span>
        </div>
      </div>
      <Money style={{ fontSize: 17, color: C.ink }}>{formatPaisa(bill.totalPaisa)}</Money>
    </Card>
  );
}

/** The split summary card at the top of a bill (one phone screenshot). */
export function SplitSummary({ title = true, shares = SHARES, check = true }: { title?: boolean; shares?: typeof SHARES; check?: boolean }) {
  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 0 }}>
      {title && (
        <>
          <span style={{ ...T.h1, fontSize: 30, color: C.ink }}>Weekly Groceries</span>
          <span style={{ ...T.body, color: C.inkSecondary, marginTop: 4 }}>Imtiaz · 18 Oct 2026</span>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Badge>Grocery</Badge>
            <Badge tone="primary">Owned</Badge>
          </div>
        </>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: title ? `1px solid ${C.line}` : "none",
          borderBottom: `1px solid ${C.line}`,
          padding: "14px 0",
          marginTop: title ? 14 : 0,
        }}
      >
        <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Total</span>
        <Money style={{ fontSize: 20, color: C.ink }}>Rs. 3,410.00</Money>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 12 }}>
        {shares.map((s) => (
          <div key={s.name} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ ...T.body, color: C.ink }}>{s.name}</span>
            <Money style={{ fontSize: 15, color: C.ink }}>{formatPaisa(s.paisa)}</Money>
          </div>
        ))}
      </div>
      {check && (
        <Badge tone="success" style={{ alignSelf: "flex-start", marginTop: 12, fontSize: 13, padding: "4px 10px" }}>
          <CircleCheck size={14} /> Shares add up to the bill total
        </Badge>
      )}
    </Card>
  );
}

/** One item in the bill's items list. */
export function ItemLine({ item, last }: { item: Item; last?: boolean }) {
  return (
    <div style={{ padding: 16, borderBottom: last ? "none" : `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...T.body, fontSize: 17, color: C.ink }}>{item.name}</span>
        <Money style={{ fontSize: 16, color: C.ink }}>{formatPaisa(item.totalPaisa)}</Money>
      </div>
      <span style={{ ...T.bodySm, color: C.inkMuted }}>{item.details}</span>
      <span style={{ ...T.bodySm, fontSize: 15, color: C.ink }}>
        {item.qty} × {formatPaisa(item.unitPaisa)}
      </span>
      <span style={{ ...T.bodySm, color: C.inkMuted }}>{item.split}</span>
    </div>
  );
}
