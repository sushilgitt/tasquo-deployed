import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions";

const navItems = [
  { label: "Home", href: "/dashboard", icon: "⌂" },
  { label: "My tasks", href: "/my-tasks", icon: "✓" },
];

// Items that exist in the design but are not built yet. Shown disabled so nothing links nowhere.
const comingSoon = ["Inbox", "Reporting"];

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-4">
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

        <div className="mt-auto border-t border-zinc-100 p-3">
          <Suspense fallback={null}>
            <AccountMenu />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur">
          <form action="/search" className="flex max-w-xl flex-1">
            <input
              name="q"
              type="search"
              maxLength={200}
              placeholder="Search tasks and projects"
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </form>
          <Link
            href="/dashboard"
            className="ml-auto rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            + New project
          </Link>
        </header>

        <main className="w-full flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

async function AccountMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
        {user.name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{user.name}</p>
        <p className="truncate text-xs text-zinc-500">{user.email}</p>
      </div>
      <form action={signOut}>
        <button className="text-xs font-medium text-zinc-500 hover:text-red-600">Sign out</button>
      </form>
    </div>
  );
}
