import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ReceiptText, ShieldCheck, Split, TrendingUp, type LucideIcon } from "lucide-react";

import { enter, pop, typed, typedEnd } from "../anim";
import { C, FONT_BODY, FONT_HEADING, T } from "../theme";
import { Button, Card, Field, Input, Logo } from "../ui/primitives";
import { Backdrop, BrowserFrame, Caption, Cursor, SceneLayout, Screen } from "../ui/stage";

const URL = "the-bill-split.vercel.app";

export function Intro() {
  const frame = useCurrentFrame();
  const s = pop(frame, 4, 14);
  const words = ["Record", "Split", "Share", "Track"];
  return (
    <Backdrop>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${0.7 + 0.3 * s})`, opacity: s }}>
          <span
            style={{
              width: 128,
              height: 128,
              borderRadius: 34,
              background: C.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 48px rgba(15,118,110,0.35)",
            }}
          >
            <ReceiptText size={68} color="#fff" strokeWidth={1.8} />
          </span>
          <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 132, color: C.primary, letterSpacing: -3 }}>
            BillSplit
          </span>
        </div>
        <p style={{ ...enter(frame, 22, 20), margin: 0, fontFamily: FONT_HEADING, fontWeight: 500, fontSize: 40, color: C.inkSecondary }}>
          Record every bill, split it fairly, and see how prices change over time.
        </p>
        <div style={{ display: "flex", gap: 18 }}>
          {words.map((w, i) => (
            <span
              key={w}
              style={{
                ...enter(frame, 38 + i * 6, 16),
                fontFamily: FONT_HEADING,
                fontWeight: 600,
                fontSize: 28,
                color: C.primary,
                background: C.primarySoft,
                padding: "10px 26px",
                borderRadius: 999,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
}

const BENEFITS: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Split, title: "Split by item", description: "Assign each item to whoever had it. Shared items split equally, to the paisa." },
  { icon: ShieldCheck, title: "Share privately", description: "Only the friends you invite to a bill can see it. Everything else stays yours." },
  { icon: TrendingUp, title: "Track prices", description: "Every saved item becomes a dated price record, so you can see what went up." },
];

export const LANDING_DURATION = 120;

export function Landing() {
  const frame = useCurrentFrame();
  return (
    <SceneLayout
      captionWidth={520}
      caption={<Caption step="01 · Welcome" title="Start on the landing page" body="A quick overview of what BillSplit does, then Get started to create an account." />}
    >
      <BrowserFrame url={URL}>
        <Screen>
          <div style={{ width: 720, margin: "0 auto", paddingTop: 196, display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ ...T.displaySm, color: C.primary }}>BillSplit</span>
              <span style={{ ...T.h3, color: C.inkSecondary }}>Record every bill, split it fairly, and see how prices change over time.</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {BENEFITS.map(({ icon: Icon, title, description }, i) => (
                <div key={title} style={{ ...enter(frame, 10 + i * 6), display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: C.primarySoft,
                      color: C.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ ...T.bodyMedium, color: C.ink }}>{title}</span>
                    <span style={{ ...T.bodySm, color: C.inkSecondary }}>{description}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button size="lg" clickAt={72}>Get started</Button>
              <Button size="lg" variant="secondary">Sign in</Button>
            </div>
          </div>
        </Screen>
        <Cursor path={[[24, 900, 680], [66, 300, 574]]} clicks={[72]} />
      </BrowserFrame>
    </SceneLayout>
  );
}

/** Centered auth/onboarding card, like the app's FormPage. */
function FormPage({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ width: 416, margin: "0 auto", paddingTop: 56, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <Logo size={24} />
        <span style={{ ...T.h1, color: C.ink }}>{title}</span>
        {description && <span style={{ ...T.bodySm, color: C.inkSecondary }}>{description}</span>}
      </div>
      <Card style={{ padding: 24 }}>{children}</Card>
    </div>
  );
}

const NAME = "Ayesha Khan";
const EMAIL = "ayesha@example.com";
const PASSWORD = "••••••••••";

export const SIGN_UP_DURATION = 170;

export function SignUp() {
  const frame = useCurrentFrame();
  const t1 = 16;
  const t2 = typedEnd(NAME, t1) + 6;
  const t3 = typedEnd(EMAIL, t2, 1.6) + 6;
  const t4 = typedEnd(PASSWORD, t3, 1.5) + 4;
  const done = typedEnd(PASSWORD, t4, 1.5);
  const focus = frame < t2 ? 0 : frame < t3 ? 1 : frame < t4 ? 2 : frame < done + 4 ? 3 : -1;
  const click = 138;
  return (
    <SceneLayout
      captionWidth={520}
      caption={<Caption step="02 · Sign up" title="Create an account" body="Just a name, email and password. No email verification, no extra services." />}
    >
      <BrowserFrame url={`${URL}/sign-up`}>
        <Screen>
          <FormPage title="Create your account">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Name">
                  <Input value={typed(NAME, frame, t1)} focused={focus === 0} />
                </Field>
                <Field label="Email">
                  <Input value={typed(EMAIL, frame, t2, 1.6)} focused={focus === 1} />
                </Field>
                <Field label="Password" hint="At least 8 characters">
                  <Input value={typed(PASSWORD, frame, t3, 1.5)} focused={focus === 2} />
                </Field>
                <Field label="Confirm password">
                  <Input value={typed(PASSWORD, frame, t4, 1.5)} focused={focus === 3} />
                </Field>
              </div>
              <Button size="lg" clickAt={click} style={{ width: "100%" }}>
                {frame >= click + 4 ? "Creating account…" : "Create account"}
              </Button>
              <span style={{ ...T.bodySm, color: C.inkSecondary, textAlign: "center" }}>
                Already have an account? <b style={{ color: C.primary }}>Sign in</b>
              </span>
            </div>
          </FormPage>
        </Screen>
        <Cursor path={[[done - 20, 820, 720], [click - 8, 600, 566]]} clicks={[click]} />
      </BrowserFrame>
    </SceneLayout>
  );
}

export const USERNAME_DURATION = 125;

export function ChooseUsername() {
  const frame = useCurrentFrame();
  const start = 14;
  const end = typedEnd("ayesha", start, 3);
  const available = frame >= end + 10;
  const click = 92;
  const checking = frame >= end && !available;
  return (
    <SceneLayout
      captionWidth={520}
      caption={
        <Caption
          step="03 · Onboarding"
          title="Pick a username"
          body="Friends invite you by username. It's the only thing other people ever see, never your name or email."
        />
      }
    >
      <BrowserFrame url={`${URL}/onboarding`}>
        <Screen>
          <FormPage title="Choose a username" description="Friends invite you to bills by your username. It's the only thing other people see.">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field
                label="Username"
                hint={checking ? "Checking…" : "3–20 characters: letters, numbers, underscore; start with a letter"}
                success={available ? "@ayesha is available" : undefined}
              >
                <Input value={typed("ayesha", frame, start, 3)} focused={frame < click} />
              </Field>
              <Button size="lg" clickAt={click} style={{ width: "100%" }}>
                {frame >= click + 4 ? "Saving…" : "Continue"}
              </Button>
            </div>
          </FormPage>
        </Screen>
        <Cursor path={[[end, 820, 640], [click - 8, 600, 400]]} clicks={[click]} />
      </BrowserFrame>
    </SceneLayout>
  );
}

export function Outro() {
  const frame = useCurrentFrame();
  const s = pop(frame, 2, 16);
  const features = ["Split by item", "Private sharing", "Bill History", "Price History", "Printable bills"];
  return (
    <Backdrop>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `scale(${0.8 + 0.2 * s})`, opacity: s }}>
          <span
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              background: C.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 48px rgba(15,118,110,0.35)",
            }}
          >
            <ReceiptText size={56} color="#fff" strokeWidth={1.8} />
          </span>
          <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 110, color: C.primary, letterSpacing: -2.5 }}>BillSplit</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 1300 }}>
          {features.map((f, i) => (
            <span
              key={f}
              style={{
                ...enter(frame, 14 + i * 5, 16),
                fontFamily: FONT_HEADING,
                fontWeight: 600,
                fontSize: 26,
                color: C.ink,
                background: C.surface,
                boxShadow: "0 6px 16px rgba(11,43,39,0.08)",
                padding: "10px 24px",
                borderRadius: 999,
              }}
            >
              {f}
            </span>
          ))}
        </div>
        <span
          style={{
            ...enter(frame, 44, 16),
            fontFamily: FONT_HEADING,
            fontWeight: 600,
            fontSize: 38,
            color: C.inkInverse,
            background: C.primary,
            padding: "14px 40px",
            borderRadius: 999,
            boxShadow: "0 16px 32px rgba(15,118,110,0.3)",
          }}
        >
          {URL}
        </span>
        <span style={{ ...enter(frame, 56, 12), fontFamily: FONT_BODY, fontSize: 24, color: C.inkMuted }}>
          Next.js · Convex · Tailwind CSS · all amounts in PKR
        </span>
      </AbsoluteFill>
    </Backdrop>
  );
}
