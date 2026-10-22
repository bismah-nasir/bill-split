import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { ChevronDown, ChevronUp, Pencil, Plus, Printer, Trash2, UserPlus, CircleCheck } from "lucide-react";

import { enter, formatPaisa, keyframes, progress, typed, typedEnd } from "../anim";
import { SHARES, WEEKLY_ITEMS } from "../data";
import { C, RADIUS, SHADOW, T } from "../theme";
import { ItemLine, SplitSummary } from "../ui/bill";
import { Badge, Button, Card, Chip, Field, Input, MobileHeader, Money, TabBar } from "../ui/primitives";
import { Caption, Cursor, PhoneFrame, SceneLayout, Screen } from "../ui/stage";

const CAPTION_W = 700;

function Page({ children, gap = 24 }: { children: ReactNode; gap?: number }) {
  return <div style={{ padding: "20px 16px 160px", display: "flex", flexDirection: "column", gap }}>{children}</div>;
}

function H3({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ ...T.h3, fontSize: 19, color: C.ink }}>{children}</span>
      {right}
    </div>
  );
}

/** Sticky "N items · Total" bar with Review, above the tab bar. */
function FormFooter({ count, totalPaisa, right }: { count: number; totalPaisa: number; right: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: C.surface,
        borderTop: `1px solid ${C.line}`,
        boxShadow: SHADOW.raised,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", ...T.bodySm, fontSize: 15, color: C.inkSecondary }}>
        <span>
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span>
          Total <Money style={{ color: C.ink }}>{formatPaisa(totalPaisa)}</Money>
        </span>
      </div>
      {right}
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>;
}

// ─── New bill: details and people ────────────────────────────────────────

export const NEW_BILL_DURATION = 230;

export function NewBill() {
  const frame = useCurrentFrame();
  const tTitle = 14;
  const tStore = typedEnd("Weekly Groceries", tTitle) + 6;
  const tDate = typedEnd("Imtiaz", tStore, 2.5) + 8;
  const tCat = tDate + 14;
  const scroll = keyframes(frame, [[tCat + 12, 0], [tCat + 34, 340], [190, 340], [212, 560]]);
  const tHamza = tCat + 44;
  const addHamza = typedEnd("Hamza", tHamza, 2.5) + 6;
  const tSara = addHamza + 10;
  const addSara = typedEnd("Sara", tSara, 2.5) + 6;
  const focus =
    frame < tStore ? "title" : frame < tDate ? "store" : frame < tCat + 8 ? "none" : frame < addSara ? "add" : "none";
  const addValue = frame < addHamza ? typed("Hamza", frame, tHamza, 2.5) : frame < addSara ? typed("Sara", frame, tSara, 2.5) : "";
  const people = [frame >= addHamza && "Hamza", frame >= addSara && "Sara"].filter(Boolean) as string[];
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="05 · New bill"
          title="Record a bill"
          body="Add the title, store, date and category, then everyone you're splitting with. They don't need an account; just type a name."
        />
      }
    >
      <PhoneFrame>
        <Screen
          header={<MobileHeader />}
          scrollY={scroll}
          footer={
            <Footer>
              <FormFooter count={1} totalPaisa={0} right={<Button size="lg">Review</Button>} />
              <TabBar active="bills" />
            </Footer>
          }
        >
          <Page>
            <span style={{ ...T.h1, color: C.ink }}>New bill</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <H3>Details</H3>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Title">
                  <Input value={typed("Weekly Groceries", frame, tTitle)} placeholder="e.g. Imtiaz Grocery" focused={focus === "title"} />
                </Field>
                <Field label="Store (optional)">
                  <Input value={typed("Imtiaz", frame, tStore, 2.5)} focused={focus === "store"} />
                </Field>
                <Field label="Date">
                  <Input value={frame >= tDate ? "18/10/2026" : "22/10/2026"} />
                </Field>
                <Field label="Category">
                  <Input value={frame >= tCat ? "Grocery" : "Select a category"} trailing={<ChevronDown size={16} />} />
                </Field>
              </Card>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <H3>People</H3>
                <span style={{ ...T.bodySm, color: C.inkSecondary }}>
                  Add anyone, with or without an account. You can connect people to their accounts after saving.
                </span>
              </div>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ height: 44, display: "flex", alignItems: "center", padding: "0 14px", ...T.bodyMedium, color: C.ink }}>You</span>
                  {people.map((p) => (
                    <div key={p} style={{ display: "flex", gap: 8, alignItems: "center", ...enter(frame, p === "Hamza" ? addHamza : addSara, 8) }}>
                      <Input value={p} style={{ flex: 1 }} />
                      <span style={{ width: 42, display: "flex", justifyContent: "center", color: C.ink }}>
                        <Trash2 size={18} />
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input value={addValue} placeholder="Add a name, e.g. Ben" focused={focus === "add"} style={{ flex: 1 }} />
                  <Button variant="secondary" icon={Plus} clickAt={frame < addSara - 2 ? addHamza : addSara}>
                    Add
                  </Button>
                </div>
              </Card>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <H3>Items</H3>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ ...T.bodySm, color: C.inkSecondary }}>Item 1</span>
                <Field label="Name">
                  <Input placeholder="e.g. Cooking oil" />
                </Field>
              </Card>
            </div>
          </Page>
        </Screen>
        <Cursor
          touch
          path={[
            [tTitle - 10, 200, 229],
            [tStore - 4, 200, 315],
            [tDate - 4, 200, 402],
            [tCat - 4, 200, 488],
            [tHamza - 8, 160, 387],
            [addHamza - 6, 306, 387],
            [tSara - 4, 160, 439],
            [addSara - 6, 306, 439],
          ]}
          clicks={[tTitle - 6, tStore - 2, tDate - 2, tCat - 2, tHamza - 6, addHamza, tSara - 2, addSara]}
        />
      </PhoneFrame>
    </SceneLayout>
  );
}

// ─── Items: name, price, who pays ────────────────────────────────────────

function ItemCard({
  index,
  name,
  qty,
  price,
  totalPaisa,
  selected,
  split,
  focused,
  details,
  everyoneClick,
  style,
}: {
  index: number;
  name: string;
  qty: string;
  price: string;
  totalPaisa: number;
  selected: string[];
  split: string;
  focused?: "name" | "qty" | "price" | "brand" | "pack";
  details?: { brand: string; pack: string };
  everyoneClick?: number;
  style?: React.CSSProperties;
}) {
  const everyone = selected.length === 3;
  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...T.bodySm, fontSize: 15, color: C.inkSecondary }}>Item {index}</span>
        <Trash2 size={18} color={C.ink} />
      </div>
      <Field label="Name">
        <Input value={name} focused={focused === "name"} />
      </Field>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <Field label="Qty" style={{ width: 72 }}>
          <Input value={qty} focused={focused === "qty"} />
        </Field>
        <Field label="Unit price" style={{ flex: 1 }}>
          <Input value={price} prefix="Rs." focused={focused === "price"} />
        </Field>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, minWidth: 96 }}>
          <span style={{ ...T.bodySm, fontWeight: 500, color: C.ink }}>Total</span>
          <Money style={{ fontSize: 16, height: 44, display: "flex", alignItems: "center", color: C.ink }}>{formatPaisa(totalPaisa)}</Money>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip label="Everyone" selected={everyone} clickAt={everyoneClick} />
        {["You", "Hamza", "Sara"].map((p) => (
          <Chip key={p} label={p} selected={selected.includes(p)} />
        ))}
      </div>
      <span style={{ ...T.bodySm, color: C.inkMuted }}>{split}</span>
      {details && (
        <>
          <span style={{ display: "flex", alignItems: "center", gap: 6, ...T.buttonSm, color: C.primary }}>
            More details <ChevronUp size={16} />
          </span>
          <Field label="Brand (optional)">
            <Input value={details.brand} focused={focused === "brand"} />
          </Field>
          <Field label="Variant (optional)">
            <Input placeholder="e.g. Extra virgin" />
          </Field>
          <Field label="Pack size (optional)">
            <Input value={details.pack} focused={focused === "pack"} />
          </Field>
        </>
      )}
    </Card>
  );
}

export const ITEMS_DURATION = 250;

export function Items() {
  const frame = useCurrentFrame();
  const tName = 10;
  const tQty = typedEnd("Cooking Oil", tName) + 4;
  const tPrice = tQty + 8;
  const priceDone = typedEnd("560", tPrice, 3);
  const everyoneAt = priceDone + 14;
  const tBrand = everyoneAt + 18;
  const tPack = typedEnd("Dalda", tBrand, 2.5) + 6;
  const packDone = typedEnd("1 litre", tPack, 2.5);
  const scrollStart = packDone + 10;
  const scroll = keyframes(frame, [[scrollStart, 0], [scrollStart + 60, 1310]]);
  const added = [scrollStart + 14, scrollStart + 30, scrollStart + 46];
  const reviewAt = 232;

  const focused =
    frame < tQty ? "name" : frame < tPrice ? "qty" : frame < priceDone + 4 ? "price" : frame >= tBrand && frame < tPack ? "brand" : frame >= tPack && frame < packDone + 4 ? "pack" : undefined;
  const oilPrice = typed("560", frame, tPrice, 3);
  const oilTotal = frame >= priceDone ? 56000 : 0;
  const oilSelected = frame >= everyoneAt ? ["You", "Hamza", "Sara"] : ["You"];
  const count = 1 + added.filter((f) => frame >= f).length;
  const totals = [56000, 241000, 299000, 341000];
  const total = frame < priceDone ? 0 : totals[count - 1];

  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="06 · Split by item"
          title="Choose who pays for each item"
          body="Tap Everyone, or pick people. Shared items split equally to the paisa: Rs. 560 three ways is 186.67 + 186.67 + 186.66."
        />
      }
    >
      <PhoneFrame>
        <Screen
          header={<MobileHeader />}
          scrollY={scroll}
          footer={
            <Footer>
              <FormFooter count={count} totalPaisa={total} right={<Button size="lg" clickAt={reviewAt}>Review</Button>} />
              <TabBar active="bills" />
            </Footer>
          }
        >
          <Page gap={16}>
            <H3>Items</H3>
            <ItemCard
              index={1}
              name={typed("Cooking Oil", frame, tName)}
              qty={frame >= tQty ? "1" : ""}
              price={oilPrice}
              totalPaisa={oilTotal}
              selected={oilSelected}
              split={frame >= everyoneAt ? "Split 3 ways: Rs. 186.67 / Rs. 186.67 / Rs. 186.66" : frame >= priceDone ? "You pay Rs. 560.00" : "You pay Rs. 0.00"}
              focused={focused}
              everyoneClick={everyoneAt}
              details={{ brand: typed("Dalda", frame, tBrand, 2.5), pack: typed("1 litre", frame, tPack, 2.5) }}
            />
            {WEEKLY_ITEMS.slice(1).map((item, i) => (
              <ItemCard
                key={item.name}
                index={i + 2}
                name={item.name}
                qty={item.qty}
                price={String(item.unitPaisa / 100)}
                totalPaisa={item.totalPaisa}
                selected={item.assignees}
                split={
                  item.assignees.length > 1
                    ? "Split 2 ways: Rs. 925.00 / Rs. 925.00"
                    : `${item.assignees[0] === "You" ? "You pay" : `${item.assignees[0]} pays`} ${formatPaisa(item.totalPaisa)}`
                }
                style={{ opacity: progress(frame, added[i] - 8, 10) }}
              />
            ))}
            <Button variant="secondary" icon={Plus} style={{ alignSelf: "flex-start" }}>
              Add item
            </Button>
          </Page>
        </Screen>
        <Cursor
          touch
          path={[
            [tName - 10, 200, 208],
            [tQty - 4, 67, 289],
            [tPrice - 4, 183, 289],
            [everyoneAt - 6, 77, 340],
            [tBrand - 6, 200, 482],
            [tPack - 4, 200, 646],
            [scrollStart, 220, 600],
            [scrollStart + 60, 220, 300],
            [reviewAt - 10, 320, 707],
          ]}
          clicks={[tName - 6, tQty - 2, tPrice - 2, everyoneAt, tBrand - 2, tPack - 2, reviewAt]}
        />
      </PhoneFrame>
    </SceneLayout>
  );
}

// ─── Review ───────────────────────────────────────────────────────────────

export const REVIEW_DURATION = 150;

export function Review() {
  const frame = useCurrentFrame();
  const save = 124;
  const scroll = keyframes(frame, [[50, 0], [90, 330]]);
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="07 · Review"
          title="Check the split, then save"
          body="Every person's share and a check that the shares add up to the bill total exactly, before anything is saved."
        />
      }
    >
      <PhoneFrame>
        <Screen
          header={<MobileHeader />}
          scrollY={scroll}
          footer={
            <Footer>
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", padding: "12px 16px", background: C.surface, borderTop: `1px solid ${C.line}`, boxShadow: SHADOW.raised }}>
                <Button variant="secondary" size="lg">Back to edit</Button>
                <Button size="lg" clickAt={save}>{frame >= save + 4 ? "Saving…" : "Save bill"}</Button>
              </div>
              <TabBar active="bills" />
            </Footer>
          }
        >
          <Page>
            <span style={{ ...T.h2, color: C.ink }}>Review your bill</span>
            <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, ...enter(frame, 4) }}>
              <span style={{ ...T.h3, color: C.ink }}>Weekly Groceries</span>
              <span style={{ ...T.bodySm, color: C.inkSecondary }}>Imtiaz · 18 Oct 2026</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge>Grocery</Badge>
                <span style={{ ...T.caption, color: C.inkMuted }}>People: You, Hamza, Sara</span>
              </div>
            </Card>
            <div style={enter(frame, 10)}>
              <SplitSummary title={false} shares={[{ name: "You", paisa: 153167 }, ...SHARES.slice(1)]} />
            </div>
            <Card style={{ overflow: "hidden", ...enter(frame, 18) }}>
              {WEEKLY_ITEMS.map((item, i) => (
                <ItemLine key={item.name} item={item} last={i === WEEKLY_ITEMS.length - 1} />
              ))}
            </Card>
          </Page>
        </Screen>
        <Cursor touch path={[[100, 250, 560], [save - 8, 316, 707]]} clicks={[save]} />
      </PhoneFrame>
    </SceneLayout>
  );
}

// ─── The saved bill ──────────────────────────────────────────────────────

function PeopleCard({ hamza }: { hamza: "invite" | "invited" | "linked" }) {
  const row = { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", minHeight: 60, boxSizing: "border-box" as const };
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ ...row, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ ...T.body, fontSize: 17, color: C.ink }}>@ayesha</span>
        <Badge>Owner</Badge>
        <Badge tone="primary">You</Badge>
      </div>
      <div style={{ ...row, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Hamza</span>
        {hamza === "invited" && <Badge tone="warning">Invited @hamza</Badge>}
        {hamza === "linked" && <Badge tone="primary">@hamza</Badge>}
        <span style={{ marginLeft: "auto" }}>
          {hamza === "invite" && <Button variant="secondary" size="sm">Invite</Button>}
          {hamza === "invited" && <span style={{ ...T.buttonSm, color: C.ink, padding: "0 12px" }}>Cancel</span>}
        </span>
      </div>
      <div style={row}>
        <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Sara</span>
        <span style={{ marginLeft: "auto" }}>
          <Button variant="secondary" size="sm">Invite</Button>
        </span>
      </div>
    </Card>
  );
}

function BillPage({ hamza, frame, check = true }: { hamza: "invite" | "invited" | "linked"; frame: number; check?: boolean }) {
  return (
    <Page>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="secondary" icon={Printer}>Print</Button>
        <Button variant="secondary" icon={Pencil}>Edit</Button>
        <Button variant="danger-soft" icon={Trash2}>Delete</Button>
      </div>
      <div style={enter(frame, 4)}>
        <SplitSummary check={check} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <H3 right={<Button variant="secondary" icon={UserPlus}>Invite</Button>}>People</H3>
        <PeopleCard hamza={hamza} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <H3>Items</H3>
        <Card style={{ overflow: "hidden" }}>
          {WEEKLY_ITEMS.map((item) => (
            <ItemLine key={item.name} item={item} />
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 16px", background: C.surfaceSubtle }}>
            <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Total</span>
            <Money style={{ fontSize: 20, color: C.ink }}>Rs. 3,410.00</Money>
          </div>
        </Card>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <H3>Shares</H3>
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Your share</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Money style={{ fontSize: 17, color: C.ink }}>Rs. 1,531.67</Money>
              <ChevronUp size={16} />
            </span>
          </div>
          {[
            ["Cooking Oil (1/3 of Rs. 560.00)", "Rs. 186.67"],
            ["Basmati Rice (1/2 of Rs. 1,850.00)", "Rs. 925.00"],
            ["Eggs", "Rs. 420.00"],
          ].map(([l, r]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", ...T.bodySm, fontSize: 15, color: C.inkSecondary }}>
              <span>{l}</span>
              <Money style={{ fontWeight: 500, color: C.ink }}>{r}</Money>
            </div>
          ))}
          {[
            ["Hamza", "Rs. 766.67"],
            ["Sara", "Rs. 1,111.66"],
          ].map(([l, r]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
              <span style={{ ...T.body, fontSize: 17, color: C.ink }}>{l}</span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Money style={{ fontSize: 17, color: C.ink }}>{r}</Money>
                <ChevronDown size={16} />
              </span>
            </div>
          ))}
        </Card>
      </div>
    </Page>
  );
}

export const BILL_DURATION = 220;

export function BillDetail() {
  const frame = useCurrentFrame();
  const scroll = keyframes(frame, [[70, 0], [120, 600], [150, 1000], [176, 1000], [196, 330]]);
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="08 · The saved bill"
          title="One screenshot to share"
          body="The bill opens with a compact summary sized for a phone screenshot, followed by every item and each person's breakdown."
        />
      }
    >
      <PhoneFrame>
        <Screen header={<MobileHeader />} scrollY={scroll} footer={<TabBar active="bills" />}>
          <BillPage hamza="invite" frame={frame} />
        </Screen>
        <SharesHighlight frame={frame} scroll={scroll} />
        <Cursor touch path={[[180, 200, 600], [205, 323, 305]]} clicks={[214]} />
      </PhoneFrame>
    </SceneLayout>
  );
}

/** A soft ring around the shares on first view. */
function SharesHighlight({ frame, scroll }: { frame: number; scroll: number }) {
  const o = keyframes(frame, [[22, 0], [32, 1], [60, 1], [70, 0]]);
  return (
    <div
      style={{
        position: "absolute",
        left: 10,
        top: 280 - scroll,
        width: 370,
        height: 182,
        borderRadius: 18,
        border: `3px solid ${C.primary}`,
        opacity: o,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Invite ─────────────────────────────────────────────────────────────

export const INVITE_DURATION = 190;

export function Invite() {
  const frame = useCurrentFrame();
  const tUser = 34;
  const typedDone = typedEnd("hamza", tUser, 3);
  const send = typedDone + 14;
  const sent = frame >= send + 6;
  const close = send + 62;
  const open = frame < close;
  const dialogIn = progress(frame, 2, 12);
  const dialogOut = progress(frame, close, 10);
  const shown = open ? dialogIn : 1 - dialogOut;
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="09 · Share privately"
          title="Invite people to see the bill"
          body="Link Hamza on the bill to his account by username or email. Only invited people can see it, and inviting never changes the split."
        />
      }
    >
      <PhoneFrame>
        <Screen header={<MobileHeader />} scrollY={330} footer={<TabBar active="bills" />}>
          <BillPage hamza={frame >= close ? "invited" : "invite"} frame={20} />
        </Screen>
        <div style={{ position: "absolute", inset: 0, background: C.overlay, opacity: shown }} />
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 110,
            opacity: shown,
            transform: `scale(${0.96 + 0.04 * shown})`,
          }}
        >
          <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 24px 48px rgba(11,43,39,0.25)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ ...T.h2, color: C.ink }}>Invite to this bill</span>
              <span style={{ ...T.bodySm, color: C.inkSecondary }}>
                Connect someone on this bill to their account so they can see it. Inviting doesn&apos;t change the split.
              </span>
            </div>
            <Field label="Who is this?">
              <Input value="Hamza" trailing={<ChevronDown size={16} />} />
            </Field>
            <Field label="Invite by">
              <div style={{ display: "flex", padding: 4, borderRadius: RADIUS.pill, background: C.surfaceMuted, alignSelf: "flex-start" }}>
                {["Username", "Email"].map((o, i) => (
                  <span
                    key={o}
                    style={{
                      padding: "6px 18px",
                      borderRadius: RADIUS.pill,
                      background: i === 0 ? C.surface : "transparent",
                      color: i === 0 ? C.primary : C.inkSecondary,
                      ...T.buttonSm,
                    }}
                  >
                    {o}
                  </span>
                ))}
              </div>
            </Field>
            <Field label="Their username">
              <Input prefix="@" value={sent ? "" : typed("hamza", frame, tUser, 3)} placeholder="ben_doe" focused={frame >= tUser - 6} />
            </Field>
            {sent && (
              <div
                style={{
                  ...enter(frame, send + 6, 8),
                  display: "flex",
                  gap: 8,
                  padding: 12,
                  borderRadius: RADIUS.md,
                  background: C.successSoft,
                  color: C.success,
                  ...T.bodySm,
                }}
              >
                <CircleCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                Invitation sent to @hamza. Once they accept, they&apos;ll see this bill as Hamza.
              </div>
            )}
            <Button clickAt={send} style={{ width: "100%" }}>
              {frame >= send && !sent ? "Sending…" : "Send invite"}
            </Button>
          </Card>
        </div>
        <InvitedHighlight frame={frame} start={close + 8} />
        <Cursor touch path={[[tUser - 14, 200, 470], [send - 8, 195, 548], [close - 10, 195, 700]]} clicks={[tUser - 8, send, close - 2]} />
      </PhoneFrame>
    </SceneLayout>
  );
}

function InvitedHighlight({ frame, start }: { frame: number; start: number }) {
  const o = keyframes(frame, [[start, 0], [start + 8, 1], [start + 40, 1], [start + 50, 0]]);
  return (
    <div
      style={{
        position: "absolute",
        left: 10,
        top: 270,
        width: 370,
        height: 66,
        borderRadius: 16,
        border: `3px solid ${C.warning}`,
        opacity: o,
      }}
    />
  );
}

// ─── The invitee's side ──────────────────────────────────────────────────

export const INVITATIONS_DURATION = 200;

/** The same items, as Hamza sees them. */
const HAMZA_SPLITS = [
  "Split 3 ways: Ayesha Khan Rs. 186.67 · You Rs. 186.67 · Sara Rs. 186.66",
  "Split 2 ways: Ayesha Khan Rs. 925.00 · Sara Rs. 925.00",
  "Paid by you",
];

export function Invitations() {
  const frame = useCurrentFrame();
  const accept = 70;
  const swap = accept + 14;
  return (
    <SceneLayout
      captionWidth={CAPTION_W}
      caption={
        <Caption
          width={CAPTION_W}
          step="09 · Share privately"
          title="Hamza accepts, and sees the bill"
          body="Signed in as Hamza Ali, the invitation waits on the Invitations page. Once accepted, the bill is shared read-only with his own share."
        />
      }
    >
      <PhoneFrame>
        {frame < swap ? (
          <Screen header={<MobileHeader user="Hamza Ali" />} footer={<TabBar active="invites" badge={1} />}>
            <Page gap={20}>
              <span style={{ ...T.displaySm, fontSize: 32, color: C.ink }}>Invitations</span>
              <div style={{ display: "inline-flex", alignSelf: "flex-start", padding: 4, borderRadius: RADIUS.pill, background: C.surfaceMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: RADIUS.pill, background: C.surface, color: C.primary, ...T.button }}>
                  Received
                  <span style={{ width: 20, height: 20, borderRadius: 10, background: C.primary, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
                </span>
                <span style={{ padding: "8px 20px", color: C.inkSecondary, ...T.button }}>Sent</span>
              </div>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, ...enter(frame, 8) }}>
                <span style={{ ...T.body, fontSize: 17, lineHeight: "24px", color: C.ink }}>
                  @ayesha invited you to <b style={{ fontFamily: "inherit" }}>Weekly Groceries</b> as <b>Hamza</b>
                </span>
                <span style={{ ...T.bodySm, fontSize: 15, color: C.inkSecondary }}>Imtiaz · 18 Oct 2026</span>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Button clickAt={accept}>Accept</Button>
                  <Button variant="secondary">Decline</Button>
                </div>
              </Card>
            </Page>
          </Screen>
        ) : (
          <Screen header={<MobileHeader user="Hamza Ali" />} footer={<TabBar active="bills" />}>
            <Page>
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", ...enter(frame, swap) }}>
                <span style={{ ...T.h1, fontSize: 30, color: C.ink }}>Weekly Groceries</span>
                <span style={{ ...T.body, color: C.inkSecondary, marginTop: 4 }}>Imtiaz · 18 Oct 2026</span>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Badge>Grocery</Badge>
                  <Badge>Shared by @ayesha</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "14px 0", marginTop: 14 }}>
                  <span style={{ ...T.body, fontSize: 17, color: C.ink }}>Total</span>
                  <Money style={{ fontSize: 20, color: C.ink }}>Rs. 3,410.00</Money>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 12 }}>
                  {[
                    ["Ayesha Khan", "Rs. 1,531.67", false],
                    ["Hamza (you)", "Rs. 766.67", true],
                    ["Sara", "Rs. 1,111.66", false],
                  ].map(([n, v, me]) => (
                    <div
                      key={n as string}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: me ? "6px 8px" : "0 8px",
                        borderRadius: 10,
                        background: me ? C.primarySoft : "transparent",
                      }}
                    >
                      <span style={{ ...T.body, color: C.ink, fontWeight: me ? 600 : 400 }}>{n}</span>
                      <Money style={{ fontSize: 15, color: C.ink }}>{v}</Money>
                    </div>
                  ))}
                </div>
                <Badge tone="success" style={{ alignSelf: "flex-start", marginTop: 12, padding: "4px 10px" }}>
                  <CircleCheck size={14} /> Shares add up to the bill total
                </Badge>
              </Card>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, ...enter(frame, swap + 10) }}>
                <H3>Items</H3>
                <Card style={{ overflow: "hidden" }}>
                  {WEEKLY_ITEMS.slice(0, 3).map((item, i) => (
                    <ItemLine key={item.name} item={{ ...item, split: HAMZA_SPLITS[i] }} />
                  ))}
                </Card>
              </div>
            </Page>
          </Screen>
        )}
        <Cursor touch path={[[30, 250, 500], [accept - 8, 70, 289]]} clicks={[accept]} hideAt={accept + 10} />
      </PhoneFrame>
    </SceneLayout>
  );
}
