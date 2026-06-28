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
  metadataBase: new URL("https://greenroom.tryarqo.com"),
  title: "The Green Room by Arqo — talk to the characters in your script",
  description:
    "Paste a script and talk to its characters — they only know what the page knows. A taste of Arqo, the screenwriting studio that remembers your scripts, your cast, and every page.",
  applicationName: "The Green Room by Arqo",
  openGraph: {
    title: "The Green Room by Arqo",
    description:
      "Paste a script and talk to its characters. They only know what the page knows. Free, by Arqo.",
    siteName: "The Green Room by Arqo",
    url: "https://greenroom.tryarqo.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Green Room by Arqo",
    description:
      "Paste a script and talk to its characters. They only know what the page knows.",
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
