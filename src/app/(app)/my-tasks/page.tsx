import Link from "next/link";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, projects, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default async function MyTasksPage() {
  await connection();
  const user = await requireUser();

  // Tasks assigned to me in any project I belong to. Subtasks are included.
  const myTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      completed: tasks.completed,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(
      projectMembers,
      and(eq(projectMembers.projectId, tasks.projectId), eq(projectMembers.userId, user.id)),
    )
    .where(eq(tasks.assigneeId, user.id))
    .orderBy(asc(tasks.completed), asc(tasks.dueDate), asc(tasks.createdAt));

  const open = myTasks.filter((t) => !t.completed);
  const done = myTasks.filter((t) => t.completed);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-medium text-indigo-600">Assigned to you</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">My tasks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {open.length} open · {done.length} completed
        </p>
      </div>

      {myTasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="font-medium text-zinc-900">Nothing assigned to you</p>
          <p className="mt-1 text-sm text-zinc-500">Tasks assigned to you in any project will appear here.</p>
        </div>
      )}

      {[{ title: "Open", list: open }, { title: "Completed", list: done }]
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <section key={g.title} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <h2 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700">{g.title}</h2>
            <ul className="divide-y divide-zinc-100">
              {g.list.map((t) => (
                <li key={t.id}>
                  <Link href={`/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                        t.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300"
                      }`}
                    >
                      {t.completed ? "✓" : ""}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-sm font-medium ${t.completed ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                      {t.title}
                    </span>
                    <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">{t.projectName}</span>
                    {t.dueDate && (
                      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{t.dueDate}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
