import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Kanban,
  ListChecks,
  ListTree,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const features = [
  {
    icon: Kanban,
    title: "List and board views",
    body: "Switch between a clean task list and a kanban board. Sections become columns you can scan at a glance.",
  },
  {
    icon: ListTree,
    title: "Subtasks",
    body: "Break big work into small steps. Parent tasks show progress as their subtasks get done.",
  },
  {
    icon: Users,
    title: "Teams on the same page",
    body: "Invite teammates by email and assign tasks to them. Everyone sees the same project, live.",
  },
  {
    icon: MessageSquare,
    title: "Comments on every task",
    body: "Discuss work where it happens. Each comment is signed with the author's name.",
  },
  {
    icon: ListChecks,
    title: "My tasks",
    body: "Everything assigned to you, across all your projects, with open work first and due dates in view.",
  },
  {
    icon: Search,
    title: "Find anything fast",
    body: "Search tasks and projects in one place. Results only show work you have access to.",
  },
];

const steps = [
  {
    icon: CalendarDays,
    title: "Create a project",
    body: "Start with To do, In progress and Done, or add your own sections.",
  },
  {
    icon: Users,
    title: "Invite your team",
    body: "Add teammates by email. They sign up once and see the projects you share.",
  },
  {
    icon: CheckCircle2,
    title: "Get work done",
    body: "Assign tasks, add subtasks and comments, then watch progress update.",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight">Tasque</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            <a href="#features" className="hover:text-zinc-900">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900">How it works</a>
          </nav>

          <Suspense fallback={<NavButtons signedIn={false} />}>
            <SignedInNav />
          </Suspense>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl">
            <div className="mx-auto h-96 max-w-3xl bg-gradient-to-tr from-indigo-300/50 via-violet-200/40 to-sky-200/40 opacity-70" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Plan, track and ship together
              </span>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
                Turn busy plans into{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  finished work
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
                Tasque is a project and task tracker for small teams. Organize work into projects, assign it to
                people, and see progress without the status-meeting overhead.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                Your projects stay private until you invite someone.
              </p>
            </div>

            <AppMockup />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-zinc-200 bg-zinc-50/70 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-600">Everything you need</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                One place for projects, tasks and the people doing them
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Simple enough to start in a minute, with the structure teams need as work grows.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <f.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-600">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                From first idea to done in three steps
              </h2>
            </div>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl bg-gradient-to-b from-white to-zinc-50 p-6 ring-1 ring-zinc-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <s.icon className="h-5 w-5 text-indigo-600" aria-hidden />
                  </div>
                  <h3 className="mt-5 font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-8 py-14 text-center shadow-xl shadow-indigo-600/20 sm:px-14">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Start your first project today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-indigo-100">
              Create an account in under a minute and invite the people you work with.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Create account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">T</span>
            <span className="font-medium text-zinc-700">Tasque</span>
          </div>
          <p>Tasque. Plan projects, track tasks, keep your team in sync.</p>
        </div>
      </footer>
    </>
  );
}

// Reads the session cookie, so it lives inside a Suspense boundary.
async function SignedInNav() {
  const user = await getCurrentUser();
  return <NavButtons signedIn={Boolean(user)} />;
}

function NavButtons({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        Open app
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/sign-in" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Sign up
      </Link>
    </div>
  );
}

// A built-in preview of the app, so the page shows the product without photos.
function AppMockup() {
  const columns = [
    {
      name: "To do",
      count: 2,
      cards: [
        { title: "Draft launch checklist", due: "Dec 2", who: "AS", tone: "bg-indigo-100 text-indigo-700" },
        { title: "Book the design review", due: "Dec 4", who: "RK", tone: "bg-emerald-100 text-emerald-700" },
      ],
    },
    {
      name: "In progress",
      count: 1,
      cards: [{ title: "Write onboarding emails", due: "Dec 3", who: "AS", tone: "bg-indigo-100 text-indigo-700" }],
    },
    {
      name: "Done",
      count: 2,
      cards: [
        { title: "Set up workspace", due: "Nov 28", who: "RK", tone: "bg-emerald-100 text-emerald-700" },
        { title: "Invite the team", due: "Nov 29", who: "AS", tone: "bg-indigo-100 text-indigo-700" },
      ],
    },
  ];

  return (
    <div className="relative">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-indigo-900/10">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
            <Search className="h-3 w-3" aria-hidden /> Launch plan
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-indigo-600">Website relaunch</p>
            <p className="text-base font-semibold text-zinc-900">Board</p>
          </div>
          <div className="flex -space-x-2">
            {["AS", "RK", "MP"].map((i) => (
              <span
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-semibold text-indigo-700"
              >
                {i}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {columns.map((col) => (
            <div key={col.name} className="rounded-xl bg-zinc-100/80 p-2.5">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-zinc-700">{col.name}</span>
                <span className="rounded-full bg-white px-1.5 text-[10px] text-zinc-500">{col.count}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((c) => (
                  <div key={c.title} className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm">
                    <p className="text-[11px] font-medium leading-4 text-zinc-800">{c.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">{c.due}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ${c.tone}`}>
                        {c.who}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xl sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold text-zinc-900">Task completed</p>
          <p className="text-[11px] text-zinc-500">Set up workspace · just now</p>
        </div>
      </div>
    </div>
  );
}
