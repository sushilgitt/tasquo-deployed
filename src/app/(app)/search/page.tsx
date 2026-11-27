import Link from "next/link";
import { connection } from "next/server";
import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, projects, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 200);

  // Escape LIKE wildcards so searching for "50%" matches literally.
  const escaped = q.replace(/[\\%_]/g, (ch) => "\\" + ch);
  const pattern = `%${escaped}%`;

  const myProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .where(eq(projectMembers.userId, user.id))
    .orderBy(asc(projects.name));

  const matchingTasks = q
    ? await db
        .select({
          id: tasks.id,
          title: tasks.title,
          completed: tasks.completed,
          projectName: projects.name,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .innerJoin(
          projectMembers,
          and(eq(projectMembers.projectId, tasks.projectId), eq(projectMembers.userId, user.id)),
        )
        .where(ilike(tasks.title, pattern))
        .orderBy(asc(tasks.title))
        .limit(50)
    : [];

  const matchingProjects = q
    ? myProjects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Search</h1>
        <form action="/search" className="mt-4">
          <input
            name="q"
            defaultValue={q}
            maxLength={200}
            autoFocus
            placeholder="Search tasks and projects"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
        </form>
      </div>

      {!q && <p className="text-sm text-zinc-500">Type to search across the projects you belong to.</p>}

      {q && matchingProjects.length === 0 && matchingTasks.length === 0 && (
        <p className="text-sm text-zinc-500">No results for &ldquo;{q}&rdquo;.</p>
      )}

      {matchingProjects.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700">Projects</h2>
          <ul className="divide-y divide-zinc-100">
            {matchingProjects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block px-5 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {matchingTasks.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <h2 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700">Tasks</h2>
          <ul className="divide-y divide-zinc-100">
            {matchingTasks.map((t) => (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                  <span className={`text-sm font-medium ${t.completed ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                    {t.title}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">{t.projectName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
