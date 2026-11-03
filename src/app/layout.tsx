import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Sea View Skydiving — Tandem Jump over Pattaya | Greedy Adventures (prototype)",
  description:
    "Assignment prototype: a redesigned Sea View Skydiving page with an AI assistant that answers from the website and shares brochures and videos.",
};

export const viewport: Viewport = {
  themeColor: "#06171f",
  // Android Chrome: the on-screen keyboard shrinks the page instead of pushing the chat panel up.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html> and <body> before React loads.
    // data-scroll-behavior: keeps smooth anchor scrolling but lets Next jump instantly between routes.
    <html lang="en" className={`${inter.variable} ${display.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
