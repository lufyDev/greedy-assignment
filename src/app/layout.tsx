import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Sea View Skydiving — Tandem Jump over Pattaya | Greedy Adventures (prototype)",
  description:
    "Assignment prototype: a redesigned Sea View Skydiving page with an AI assistant that answers from the website and shares brochures and videos.",
};

export const viewport: Viewport = {
  themeColor: "#06171f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
