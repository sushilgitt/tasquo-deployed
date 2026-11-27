import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasque",
  description: "Tasque: plan projects, track tasks, and keep your team in sync.",
};

const navItems = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Projects", href: "/", icon: "▤" },
];

// Items that exist in the design but are not built yet. Shown disabled so nothing links nowhere.
const comingSoon = ["My tasks", "Inbox", "Reporting"];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-[#f6f7f9] text-zinc-900">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
          <Link href="/" className="flex items-center gap-2 px-5 py-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-sm font-bold text-white">
              T
            </span>
            <span className="text-base font-semibold tracking-tight">Tasque</span>
          </Link>

          <nav className="flex flex-col gap-0.5 px-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <span className="w-4 text-center text-zinc-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            {comingSoon.map((label) => (
              <span
                key={label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400"
                title="Coming soon"
              >
                <span className="w-4 text-center">·</span>
                {label}
              </span>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur">
            <div className="flex max-w-xl flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400">
              <span>⌕</span>
              <span>Search (coming soon)</span>
            </div>
            <Link
              href="/"
              className="ml-auto rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              + New project
            </Link>
          </header>

          <main className="w-full flex-1 px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
