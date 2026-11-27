import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, projects, sections, tasks } from "@/db/schema";
import { parseUuid } from "@/lib/form";
import { addComment, deleteComment, deleteTask, updateTask } from "@/app/actions";

export const instant = false;

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id: rawId } = await params;
  const taskId = parseUuid(rawId);
  if (!taskId) notFound();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId)).limit(1);
  const [projectSections, taskComments] = await Promise.all([
    db
      .select()
      .from(sections)
      .where(eq(sections.projectId, task.projectId))
      .orderBy(asc(sections.position), asc(sections.name)),
    db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(asc(comments.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${task.projectId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← {project?.name ?? "Project"}
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <form action={updateTask} className="grid gap-3">
          <input type="hidden" name="taskId" value={task.id} />

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Title</span>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={task.title}
              className="rounded border border-zinc-300 px-3 py-2 text-base"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Description</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={task.description ?? ""}
              className="rounded border border-zinc-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-600">Assignee</span>
              <input
                name="assignee"
                maxLength={200}
                defaultValue={task.assignee ?? ""}
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-zinc-600">Due date</span>
              <input
                type="date"
                name="dueDate"
                defaultValue={task.dueDate ?? ""}
                className="rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-zinc-600">Section</span>
              <select
                name="sectionId"
                defaultValue={task.sectionId ?? ""}
                className="rounded border border-zinc-300 px-3 py-2"
              >
                <option value="">No section</option>
                {projectSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-zinc-500">
              {task.completed ? "Completed" : "Open"}
            </span>
            <button className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
              Save changes
            </button>
          </div>
        </form>

        <form action={deleteTask} className="mt-4 border-t border-zinc-100 pt-4">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="projectId" value={task.projectId} />
          <button className="text-sm text-red-700 hover:underline">Delete task</button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Comments ({taskComments.length})</h2>

        {taskComments.length > 0 && (
          <ul className="mt-3 space-y-3">
            {taskComments.map((c) => (
              <li key={c.id} className="rounded bg-zinc-50 p-3">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>
                    {c.author ?? "Anonymous"} · {c.createdAt.toLocaleString()}
                  </span>
                  <form action={deleteComment}>
                    <input type="hidden" name="commentId" value={c.id} />
                    <button className="hover:text-red-700">Delete</button>
                  </form>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form action={addComment} className="mt-4 grid gap-2">
          <input type="hidden" name="taskId" value={task.id} />
          <input
            name="author"
            maxLength={200}
            placeholder="Your name (optional)"
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={5000}
            placeholder="Write a comment…"
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <button className="justify-self-start rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
            Post comment
          </button>
        </form>
      </section>
    </div>
  );
}
