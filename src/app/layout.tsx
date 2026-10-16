import type { Metadata } from "next";
import { fontVariables } from "@design/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "BillSplit",
  description:
    "Record bills, split them fairly by item, share them privately and track item prices over time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
