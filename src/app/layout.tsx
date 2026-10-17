import { Suspense } from "react";
import type { Metadata } from "next";

import { fontVariables } from "@design/fonts";
import { AuthClientProvider, AuthServerProvider } from "@/lib/auth/provider";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BillSplit", template: "%s · BillSplit" },
  description:
    "Record bills, split them fairly by item, share them privately and track item prices over time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        {/* AuthServerProvider reads the session cookies. With Cache Components a request
            read must sit inside <Suspense>, so the document shell stays static. */}
        <Suspense>
          <AuthServerProvider>
            <AuthClientProvider>{children}</AuthClientProvider>
          </AuthServerProvider>
        </Suspense>
      </body>
    </html>
  );
}
