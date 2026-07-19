import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "./components";
import "./globals.css";

export const metadata: Metadata = {
  title: "FDD Contract Change Evidence Explorer",
  description:
    "An auditable explorer for consecutive-year variation and cross-period substantive change in Franchise Disclosure Documents.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
