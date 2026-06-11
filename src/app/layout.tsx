import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import Nav from "@/components/Nav";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/constants";
import "./globals.css";

// Cloudflare Pages (@cloudflare/next-on-pages) requires edge runtime for SSR routes
export const runtime = "edge";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
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
      <body className={`${anton.variable} ${archivo.variable} antialiased`}>
        <Nav />
        <main className="mx-auto min-h-[80vh] w-full max-w-5xl px-4 pb-20 pt-6">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-8 text-center text-xs lowercase text-muted">
          <span className="wordmark text-sm text-white">ONTURF</span> · albuquerque, nm ·{" "}
          {TAGLINE}
        </footer>
      </body>
    </html>
  );
}
