import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "City Cabs Booking",
  description:
    "A Next.js taxi booking system with customer booking and admin dispatch flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.24),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] text-slate-900">
        <div className="min-h-screen">
          <header className="border-b border-white/60 bg-white/65 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="group inline-flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/20">
                  CC
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">
                    City Cabs
                  </p>
                  <p className="text-sm text-slate-700">Booking and dispatch</p>
                </div>
              </Link>

              <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 p-1 shadow-sm">
                <Link
                  href="/"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Booking
                </Link>
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Admin
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex min-h-[calc(100vh-76px)] flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
