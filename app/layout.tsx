import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Courier_Prime } from "next/font/google";
import "./globals.css";

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Green Room — Arqo",
  description:
    "Talk to the people you're writing. A rehearsal room for screenwriters, grounded only in what the page has decided. An Arqo experiment.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${courier.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
