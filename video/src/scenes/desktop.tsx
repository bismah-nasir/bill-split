import { useCurrentFrame } from "remotion";
import { ArrowLeft, ArrowUp, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleDot, Info, Plus, Search, TrendingUp, X } from "lucide-react";

import { countUp, enter, formatPaisa, keyframes, progress, typed, typedEnd } from "../anim";
import { BILLS, PRICE_RECORDS } from "../data";
import { C, FONT_HEADING, RADIUS, T } from "../theme";
import { TripCard } from "../ui/bill";
import { Button, Card, DesktopHeader, Input } from "../ui/primitives";
import { BrowserFrame, Caption, Cursor, SceneLayout, Screen } from "../ui/stage";

const URL = "the-bill-split.vercel.app";
const CAPTION_W = 520;

function StatTile({ label, paisa, note, frame, start }: { label: string; paisa: number; note: string; frame: number; start: number }) {
  return (
    <Card style={{ flex: 1, padding: "26px 20px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ ...T.body, fontSize: 17, color: C.inkSecondary }}>{label}</span>
      <span style={{ ...T.numeric, color: C.ink, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
        {formatPaisa(countUp(frame, start, paisa, 36))}
      </span>
      <span style={{ ...T.caption, fontSize: 13, color: C.inkSecondary }}>{note}</span>
    </Card>
  );
}

export const DASHBOARD_DURATION = 190;

export function Dashboard() {
  const frame = useCurrentFrame();
  const scroll = keyframes(frame, [[92, 0], [124, 300], [146, 300], [164, 0]]);
  const click = 178;
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          step="04 · Dashboard"
          title="Your month at a glance"
          body="Two figures, never mixed: what you owe across every bill you're on, and the full totals of bills you created."
        />
      }
    >
      <BrowserFrame url={`${URL}/dashboard`}>
        <Screen header={<DesktopHeader active="home" />} scrollY={scroll}>
          <div style={{ width: 720, margin: "0 auto", padding: "28px 0 40px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...T.h1, color: C.ink }}>Hi, Ayesha Khan</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Button variant="ghost" icon={TrendingUp}>Compare prices</Button>
                <Button size="lg" icon={Plus} clickAt={click}>New bill</Button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}>
              <span style={{ ...T.h3, color: C.ink }}>Spending</span>
              <span style={{ display: "flex", alignItems: "center", gap: 18, ...T.body, fontSize: 17, color: C.ink }}>
                <ChevronLeft size={16} /> Oct 2026 <ChevronRight size={16} color={C.inkMuted} />
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16, ...enter(frame, 6) }}>
              <StatTile label="Your share" paisa={1410834} note="Your portion of 4 bills dated in October" frame={frame} start={10} />
              <StatTile label="Bills you created" paisa={2082000} note="Total of 4 bills you created in October" frame={frame} start={16} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, ...T.caption, fontSize: 13, color: C.inkSecondary }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              Your share is what you owe on every bill you&apos;re on, including bills shared with you. Bills you created is the full total of the bills you own, whoever pays.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30, padding: "0 16px 0 0" }}>
              <span style={{ ...T.h3, color: C.ink }}>Recent bills</span>
              <span style={{ ...T.buttonSm, color: C.ink }}>View all bills</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {BILLS.map((bill, i) => (
                <TripCard key={bill.title} bill={bill} highlight={i === 0} style={enter(frame, 24 + i * 7)} />
              ))}
            </div>
          </div>
        </Screen>
        <Cursor path={[[60, 700, 520], [100, 640, 560], [150, 760, 300], [click - 8, 885, 107]]} clicks={[click]} />
      </BrowserFrame>
    </SceneLayout>
  );
}

function FilterSelect({ label, value, icon = "chevron" }: { label: string; value: string; icon?: "chevron" | "calendar" }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ ...T.bodySm, fontWeight: 500, color: C.ink }}>{label}</span>
      <Input value={value} trailing={icon === "calendar" ? <Calendar size={16} /> : <ChevronDown size={16} />} />
    </div>
  );
}

function Segmented({ options, active }: { options: string[]; active: number }) {
  return (
    <div style={{ display: "inline-flex", alignSelf: "flex-start", padding: 4, borderRadius: RADIUS.pill, background: C.surfaceMuted }}>
      {options.map((o, i) => (
        <span
          key={o}
          style={{
            padding: "8px 16px",
            borderRadius: RADIUS.pill,
            background: i === active ? C.surface : "transparent",
            color: i === active ? C.primary : C.inkSecondary,
            boxShadow: i === active ? "0 1px 4px rgba(11,43,39,0.08)" : "none",
            ...T.buttonSm,
          }}
        >
          {o}
        </span>
      ))}
    </div>
  );
}

export const HISTORY_DURATION = 190;

export function BillHistory() {
  const frame = useCurrentFrame();
  const typeStart = 44;
  const typeEnd = typedEnd("oil", typeStart, 4);
  const clearAt = 108;
  const ownedAt = 128;
  const prices = 176;
  const term = frame < clearAt ? typed("oil", frame, typeStart, 4) : "";
  const filtered = term === "oil";
  const bills = filtered ? BILLS.filter((b) => b.category === "Grocery") : BILLS;
  const listIn = filtered ? typeEnd : clearAt;
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          step="10 · Bill History"
          title="Find any bill"
          body="Search by title, store or even an item name. Filter by date, category and Created by me / Shared with me."
        />
      }
    >
      <BrowserFrame url={`${URL}/trips${filtered ? "?q=oil" : ""}`}>
        <Screen header={<DesktopHeader active="bills" />}>
          <div style={{ width: 720, margin: "0 auto", padding: "28px 0", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...T.h1, color: C.ink }}>Bills</span>
              <Button size="lg" icon={Plus}>New bill</Button>
            </div>
            <Input
              value={term}
              focused={frame >= typeStart - 6 && frame < clearAt}
              placeholder="Search title, store or item"
              leading={<Search size={18} color={C.inkSecondary} />}
              style={{ height: 46 }}
              trailing={term ? <X size={16} color={C.inkSecondary} /> : undefined}
            />
            <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <FilterSelect label="From" value="mm/dd/yyyy" icon="calendar" />
                <FilterSelect label="To" value="mm/dd/yyyy" icon="calendar" />
                <FilterSelect label="Category" value="All categories" />
                <FilterSelect label="Sort by" value="Newest first" />
              </div>
              <Segmented options={["All", "Created by me", "Shared with me"]} active={frame >= ownedAt ? 1 : 0} />
            </Card>
            <span style={{ ...T.bodySm, color: C.inkSecondary, marginTop: 4 }}>{bills.length} bills</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bills.map((bill, i) => (
                <TripCard key={bill.title} compact bill={bill} style={enter(frame, Math.max(0, listIn) + i * 4, 10)} />
              ))}
            </div>
          </div>
        </Screen>
        <Cursor
          path={[[20, 700, 400], [typeStart - 8, 520, 175], [clearAt - 10, 520, 175], [clearAt - 4, 930, 175], [ownedAt - 8, 380, 380], [prices - 10, 380, 380], [prices - 2, 433, 26]]}
          clicks={[typeStart - 6, clearAt, ownedAt, prices]}
        />
      </BrowserFrame>
    </SceneLayout>
  );
}

/** Product price chart; the line draws itself from `start`. */
function PriceChart({ frame, start }: { frame: number; start: number }) {
  const W = 588;
  const H = 160;
  const pts = [
    [0, H],
    [W / 2, H / 2],
    [W, 0],
  ];
  const reveal = progress(frame, start, 36);
  const line = `M${pts.map((p) => p.join(",")).join(" L")}`;
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <Card style={{ padding: 24, ...enter(frame, start - 6) }}>
      <span style={{ ...T.bodyMedium, color: C.ink }}>Price over time</span>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div style={{ height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", ...T.caption, fontFamily: FONT_HEADING, color: C.inkMuted, textAlign: "right", whiteSpace: "nowrap" }}>
          <span style={{ transform: "translateY(-50%)" }}>Rs. 560.00</span>
          <span style={{ transform: "translateY(50%)" }}>Rs. 520.00</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
            <defs>
              <clipPath id="reveal">
                <rect x={-10} y={-10} width={(W + 20) * reveal} height={H + 20} />
              </clipPath>
            </defs>
            <line x1={0} x2={W} y1={0} y2={0} stroke={C.lineStrong} />
            <line x1={0} x2={W} y1={H} y2={H} stroke={C.lineStrong} />
            <g clipPath="url(#reveal)">
              <path d={area} fill={C.primarySoft} />
              <path d={line} fill="none" stroke={C.primary} strokeWidth={2} strokeLinejoin="round" />
            </g>
            {pts.map(([x, y], i) => {
              const shown = reveal * W >= x - 1;
              return <circle key={i} cx={x} cy={y} r={shown ? 4.5 : 0} fill={C.primary} />;
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", ...T.caption, color: C.inkMuted }}>
            <span>20 Sep 2026</span>
            <span>18 Oct 2026</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

const COLS = "100px 84px 160px 64px 80px 1fr";

function RecordsTable({ frame, start }: { frame: number; start: number }) {
  const cell = { ...T.bodySm, fontSize: 15, color: C.ink };
  return (
    <Card style={{ overflow: "hidden", ...enter(frame, start) }}>
      <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "14px 16px", ...T.caption, fontSize: 13, fontWeight: 600, color: C.inkSecondary, borderBottom: `1px solid ${C.line}` }}>
        <span>Date</span>
        <span style={{ textAlign: "right" }}>Unit price</span>
        <span>Change</span>
        <span>Qty/Unit</span>
        <span>Store</span>
        <span>Bill</span>
      </div>
      {PRICE_RECORDS.map((r, i) => (
        <div
          key={r.date}
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 12,
            padding: "13px 16px",
            alignItems: "center",
            borderBottom: i < 2 ? `1px solid ${C.line}` : "none",
            ...enter(frame, start + 6 + i * 6, 8),
          }}
        >
          <span style={cell}>{r.date}</span>
          <span style={{ ...cell, fontWeight: 700, textAlign: "right" }}>{r.unit}</span>
          {r.change ? (
            <span style={{ ...cell, color: C.error, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowUp size={14} /> {r.change}
            </span>
          ) : (
            <span style={{ ...cell, color: C.inkMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <CircleDot size={14} /> First record
            </span>
          )}
          <span style={cell}>1</span>
          <span style={cell}>{r.store}</span>
          <span style={{ ...cell, color: C.primary, textDecoration: "underline", textUnderlineOffset: 4, whiteSpace: "nowrap" }}>{r.bill}</span>
        </div>
      ))}
    </Card>
  );
}

export const PRICES_DURATION = 250;

export function PriceHistory() {
  const frame = useCurrentFrame();
  const typeStart = 22;
  const term = typed("cooking oil", frame, typeStart, 2.5);
  const typeDone = typedEnd("cooking oil", typeStart, 2.5);
  const resultsAt = typeDone + 8;
  const select = 86;
  const detail = frame >= select + 4;
  const scroll = keyframes(frame, [[170, 0], [195, 70]]);
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          step="11 · Price History"
          title="See what went up"
          body="Every saved item becomes a dated price record. Cooking Oil from Dalda: Rs. 520 → 540 → 560, with the change each time."
        />
      }
    >
      <BrowserFrame url={`${URL}/price-history${frame >= typeDone ? "?q=cooking+oil" : ""}`}>
        <Screen header={<DesktopHeader active="prices" />} scrollY={scroll}>
          <div style={{ width: 720, margin: "0 auto", padding: "28px 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ ...T.h1, color: C.ink }}>Price History</span>
              <span style={{ ...T.bodySm, color: C.inkSecondary }}>See what you paid for an item across your bills.</span>
            </div>
            <Input
              value={term}
              focused={frame >= typeStart - 6 && frame < select}
              placeholder="Search items, e.g. cooking oil"
              leading={<Search size={18} color={C.inkSecondary} />}
              style={{ height: 44 }}
              trailing={term ? <X size={16} color={C.inkSecondary} /> : undefined}
            />
            {!detail && frame >= resultsAt && (
              <div
                style={{
                  ...enter(frame, resultsAt),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 20,
                  borderRadius: RADIUS.lg,
                  background: frame >= select - 12 ? C.surfaceSubtle : C.surface,
                  boxShadow: "0 6px 16px rgba(11,43,39,0.08)",
                }}
              >
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ ...T.bodyMedium, color: C.ink }}>Cooking Oil</span>
                  <span style={{ ...T.bodySm, color: C.inkSecondary }}>Dalda · 1 litre</span>
                  <span style={{ ...T.caption, color: C.inkMuted }}>3 records · latest Rs. 560.00 on 18 Oct 2026</span>
                </span>
                <ChevronRight size={16} color={C.inkMuted} />
              </div>
            )}
            {detail && (
              <>
                <span style={{ ...enter(frame, select + 4), display: "flex", alignItems: "center", gap: 8, ...T.buttonSm, color: C.ink, padding: "6px 16px" }}>
                  <ArrowLeft size={16} /> Back to results
                </span>
                <div style={{ ...enter(frame, select + 6), display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ ...T.h2, color: C.ink }}>Cooking Oil</span>
                  <span style={{ ...T.bodySm, color: C.inkSecondary }}>Dalda · 1 litre</span>
                  <span style={{ ...T.caption, color: C.inkMuted }}>3 records · latest Rs. 560.00 on 18 Oct 2026</span>
                </div>
                <PriceChart frame={frame} start={select + 16} />
                <RecordsTable frame={frame} start={select + 44} />
              </>
            )}
          </div>
        </Screen>
        <Cursor path={[[6, 700, 500], [typeStart - 8, 500, 202], [resultsAt + 6, 520, 202], [select - 6, 520, 290], [select + 30, 860, 560]]} clicks={[typeStart - 6, select]} />
      </BrowserFrame>
    </SceneLayout>
  );
}
