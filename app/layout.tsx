import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Courier_Prime } from "next/font/google";
import "./globals.css";

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Green Room — an Arqo experiment",
  description:
    "Talk to the people you're writing. A rehearsal room for screenwriters, grounded only in what the page has decided. An Arqo experiment.",
  openGraph: {
    title: "The Green Room",
    description:
      "Talk to the characters in your script. They only know what the page knows.",
    siteName: "The Green Room",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d07",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${courier.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
