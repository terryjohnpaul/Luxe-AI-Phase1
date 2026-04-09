import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXE AI — Intelligence Platform for Luxury Fashion Marketing",
  description:
    "AI-powered marketing automation for luxury fashion e-commerce. Manage Meta + Google ads, optimize budgets, generate creative, process real-time signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
