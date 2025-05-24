import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackMate - Financial Dashboard",
  description: "Track your finances with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
