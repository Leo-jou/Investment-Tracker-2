import type { Metadata } from "next";

import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "FolioCore",
  description: "Self-hosted personal portfolio tracking MVP",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
