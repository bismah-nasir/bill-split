import Link from "next/link";
import { ShieldCheck, Split, TrendingUp, type LucideIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

const benefits: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Split,
    title: "Split by item",
    description: "Assign each item to whoever had it. Shared items split equally, to the paisa.",
  },
  {
    icon: ShieldCheck,
    title: "Share privately",
    description: "Only the friends you invite to a bill can see it. Everything else stays yours.",
  },
  {
    icon: TrendingUp,
    title: "Track prices",
    description: "Every saved item becomes a dated price record, so you can see what went up.",
  },
];

// Signed-in visitors are redirected to /dashboard by src/proxy.ts, so this page stays static.
export default function LandingPage() {
  return (
    <main className="flex min-h-dvh items-center py-48">
      <PageContainer className="flex flex-col gap-40">
        <header className="flex flex-col gap-12">
          <h1 className="type-display-sm text-primary">BillSplit</h1>
          <p className="type-h3 text-ink-secondary">
            Record every bill, split it fairly, and see how prices change over time.
          </p>
        </header>

        <ul className="flex flex-col gap-24">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-16">
              <span className="flex size-tap shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Icon aria-hidden className="size-icon-lg" />
              </span>
              <div className="flex flex-col gap-4">
                <h2 className="type-body-medium">{title}</h2>
                <p className="type-body-sm text-ink-secondary">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-12 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </PageContainer>
    </main>
  );
}
