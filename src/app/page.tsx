import Link from "next/link";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { createProject } from "./actions";

// Data comes from the database, so render per request instead of at build time.
export const instant = false;

export default async function HomePage() {
  await connection(); // Render per request: the list comes from the database.
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Projects</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {allProjects.length} {allProjects.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </section>

      {allProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="font-medium text-zinc-900">No projects yet</p>
          <p className="mt-1 text-sm text-zinc-500">Create your first project below to start planning.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="mt-4 font-semibold text-zinc-900 group-hover:text-indigo-700">{p.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {p.description || "No description"}
                </p>
                <p className="mt-auto pt-4 text-xs text-zinc-400">
                  Created {p.createdAt.toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">New project</h2>
        <p className="mt-1 text-sm text-zinc-500">Every project starts with To do, In progress and Done sections.</p>
        <form action={createProject} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input
            name="name"
            required
            maxLength={200}
            placeholder="Project name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
            Create project
          </button>
        </form>
      </section>
    </div>
  );
}
