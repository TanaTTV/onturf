import type { Metadata } from "next";
import { Archivo, Archivo_Black, IBM_Plex_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import FeedbackWidget from "@/components/FeedbackWidget";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/constants";
import "./globals.css";

// Cloudflare Pages (@cloudflare/next-on-pages) requires edge runtime for SSR routes
export const runtime = "edge";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "The Albuquerque music scene in one place: local shows, artists, producers, engineers, and venues. Find shows. Get found.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${archivo.variable} ${mono.variable} antialiased`}>
        <Nav />
        <main className="mx-auto min-h-[80vh] w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-hairline px-4 py-6 sm:px-6">
          <p className="mono-meta-xs text-muted">
            ONTURF — ALBUQUERQUE NM — FIND SHOWS — GET FOUND
          </p>
        </footer>
        <FeedbackWidget />
      </body>
    </html>
  );
}
