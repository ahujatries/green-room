import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Courier_Prime } from "next/font/google";
import "./globals.css";
import { isGateUnlocked } from "@/lib/gate";
import { GateScreen } from "@/components/gate-screen";

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Green Room — talk to the characters in your script",
  description:
    "Paste a script and talk to its characters — they only know what the page knows.",
  applicationName: "The Green Room",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The Green Room",
    description:
      "Paste a script and talk to its characters. They only know what the page knows.",
    siteName: "The Green Room",
    url: siteUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Green Room",
    description:
      "Paste a script and talk to its characters. They only know what the page knows.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d07",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Password gate. Done here (not in middleware) because this Next/Vercel combo
  // mis-bundles Edge middleware; the layout runs on Node and is unaffected.
  const unlocked = await isGateUnlocked();
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${courier.variable}`}
    >
      <body className="font-sans antialiased">
        {unlocked ? children : <GateScreen />}
      </body>
    </html>
  );
}
