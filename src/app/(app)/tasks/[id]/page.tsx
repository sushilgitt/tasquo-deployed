import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, projectMembers, projects, sections, tasks, users } from "@/db/schema";
import { getProjectRole } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { parseUuid } from "@/lib/form";
import {
  addComment,
  createTask,
  deleteComment,
  deleteTask,
  toggleTask,
  updateTask,
} from "@/app/actions";

export const instant = false;

const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { id: rawId } = await params;
  const taskId = parseUuid(rawId);
  if (!taskId) notFound();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) notFound();

  // Non-members get a 404 for tasks in projects they can't see.
  const role = await getProjectRole(task.projectId, user.id);
  if (!role) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId)).limit(1);
  const [projectSections, members, subtasks, taskComments, parent] = await Promise.all([
    db
      .select()
      .from(sections)
      .where(eq(sections.projectId, task.projectId))
      .orderBy(asc(sections.position), asc(sections.name)),
    db
      .select({ id: users.id, name: users.name })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, task.projectId))
      .orderBy(asc(users.name)),
    db
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, taskId))
      .orderBy(asc(tasks.createdAt)),
    db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(asc(comments.createdAt)),
    task.parentTaskId
      ? db.select({ id: tasks.id, title: tasks.title }).from(tasks).where(eq(tasks.id, task.parentTaskId)).limit(1)
      : Promise.resolve([]),
  ]);

  const isOwner = role === "owner";
  const subDone = subtasks.filter((s) => s.completed).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href={`/projects/${task.projectId}`} className="font-medium hover:text-indigo-600">
          ← {project?.name ?? "Project"}
        </Link>
        {parent[0] && (
          <>
            <span>/</span>
            <Link href={`/tasks/${parent[0].id}`} className="hover:text-indigo-600">
              {parent[0].title}
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <form action={updateTask} id="task-form" className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <input type="hidden" name="taskId" value={task.id} />

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</span>
              <input
                name="title"
                required
                maxLength={200}
                defaultValue={task.title}
                className="rounded-lg border border-transparent px-1 py-1 text-2xl font-semibold tracking-tight text-zinc-900 outline-none transition hover:border-zinc-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</span>
              <textarea
                name="description"
                rows={6}
                defaultValue={task.description ?? ""}
                placeholder="Add more detail to this task…"
                className={fieldClass}
              />
            </label>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  task.completed ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${task.completed ? "bg-emerald-500" : "bg-zinc-400"}`} />
                {task.completed ? "Completed" : "Open"}
              </span>
              <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
                Save changes
              </button>
            </div>
          </form>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">
                Subtasks <span className="font-normal text-zinc-400">({subDone}/{subtasks.length})</span>
              </h2>
            </div>

            {subtasks.length > 0 && (
              <ul className="mt-4 divide-y divide-zinc-100">
                {subtasks.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <form action={toggleTask}>
                      <input type="hidden" name="taskId" value={s.id} />
                      <input type="hidden" name="completed" value={String(s.completed)} />
                      <button
                        aria-label={s.completed ? "Mark incomplete" : "Mark complete"}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                          s.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 hover:border-indigo-500"
                        }`}
                      >
                        {s.completed ? "✓" : ""}
                      </button>
                    </form>
                    <Link
                      href={`/tasks/${s.id}`}
                      className={`text-sm hover:underline ${s.completed ? "text-zinc-400 line-through" : "text-zinc-800"}`}
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!task.parentTaskId && (
              <form action={createTask} className="mt-4 flex gap-2">
                <input type="hidden" name="projectId" value={task.projectId} />
                <input type="hidden" name="parentTaskId" value={task.id} />
                {task.sectionId && <input type="hidden" name="sectionId" value={task.sectionId} />}
                <input name="title" required maxLength={200} placeholder="Add a subtask" className={`min-w-0 flex-1 ${fieldClass}`} />
                <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Add</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-zinc-900">
              Comments <span className="font-normal text-zinc-400">({taskComments.length})</span>
            </h2>

            {taskComments.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {taskComments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {(c.author ?? "A").slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl bg-zinc-50 p-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                        <span>
                          <span className="font-medium text-zinc-700">{c.author ?? "Anonymous"}</span> ·{" "}
                          {c.createdAt.toLocaleString()}
                        </span>
                        {(c.authorId === user.id || isOwner) && (
                          <form action={deleteComment}>
                            <input type="hidden" name="commentId" value={c.id} />
                            <button className="hover:text-red-600">Delete</button>
                          </form>
                        )}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-800">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">No comments yet.</p>
            )}

            <form action={addComment} className="mt-6 grid gap-2 border-t border-zinc-100 pt-5">
              <input type="hidden" name="taskId" value={task.id} />
              <textarea
                name="body"
                required
                rows={3}
                maxLength={5000}
                placeholder="Write a comment…"
                className={fieldClass}
              />
              <button className="justify-self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
                Post comment as {user.name}
              </button>
            </form>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Details</h2>

          {/* These fields belong to the task form above; the HTML form attribute links them. */}
          <label className="grid gap-1.5">
            <span className="text-sm text-zinc-600">Assignee</span>
            <select form="task-form" name="assigneeId" defaultValue={task.assigneeId ?? ""} className={fieldClass}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm text-zinc-600">Due date</span>
            <input form="task-form" type="date" name="dueDate" defaultValue={task.dueDate ?? ""} className={fieldClass} />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm text-zinc-600">Section</span>
            <select form="task-form" name="sectionId" defaultValue={task.sectionId ?? ""} className={fieldClass}>
              <option value="">No section</option>
              {projectSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <form action={deleteTask} className="border-t border-zinc-100 pt-5">
            <input type="hidden" name="taskId" value={task.id} />
            <button className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline">
              Delete task
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
