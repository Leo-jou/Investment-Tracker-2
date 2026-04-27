import type { Metadata } from "next";

import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Tracker",
  description: "Self-hosted personal portfolio tracking MVP"
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
