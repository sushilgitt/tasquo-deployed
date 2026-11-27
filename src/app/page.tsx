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
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Projects</h1>

        {allProjects.length === 0 ? (
          <p className="mt-4 text-zinc-600">No projects yet. Create your first one below.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {allProjects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block px-4 py-3 hover:bg-zinc-50">
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="text-sm text-zinc-600">{p.description}</div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">New project</h2>
        <form action={createProject} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input
            name="name"
            required
            maxLength={200}
            placeholder="Project name"
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <button className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
            Create
          </button>
        </form>
      </section>
    </div>
  );
}
