import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, sections, tasks } from "@/db/schema";
import { parseUuid } from "@/lib/form";
import {
  createSection,
  createTask,
  deleteProject,
  deleteSection,
  toggleTask,
} from "@/app/actions";

export const instant = false;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id: rawId } = await params;
  const projectId = parseUuid(rawId);
  if (!projectId) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) notFound();

  const [projectSections, projectTasks] = await Promise.all([
    db
      .select()
      .from(sections)
      .where(eq(sections.projectId, projectId))
      .orderBy(asc(sections.position), asc(sections.name)),
    db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.createdAt)),
  ]);

  const unsectioned = projectTasks.filter((t) => t.sectionId === null);
  const done = projectTasks.filter((t) => t.completed).length;
  const percent = projectTasks.length === 0 ? 0 : Math.round((done / projectTasks.length) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-indigo-600">
          ← All projects
        </Link>
      </div>

      <section className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{project.name}</h1>
          {project.description && <p className="mt-2 text-zinc-600">{project.description}</p>}

          <div className="mt-5 flex items-center gap-4">
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="whitespace-nowrap text-sm text-zinc-500">
              {done} of {projectTasks.length} done · {percent}%
            </span>
          </div>
        </div>

        <form action={deleteProject}>
          <input type="hidden" name="projectId" value={project.id} />
          <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
            Delete project
          </button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {unsectioned.length > 0 && (
          <TaskGroup title="No section" projectId={project.id} tasks={unsectioned} />
        )}

        {projectSections.map((s) => (
          <TaskGroup
            key={s.id}
            title={s.name}
            projectId={project.id}
            sectionId={s.id}
            tasks={projectTasks.filter((t) => t.sectionId === s.id)}
            onDeleteSectionId={s.id}
          />
        ))}

        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5">
          <h2 className="font-semibold text-zinc-900">Add section</h2>
          <form action={createSection} className="mt-3 flex gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              name="name"
              required
              maxLength={200}
              placeholder="Section name"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
              Add
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

type TaskRecord = typeof tasks.$inferSelect;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function formatDue(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TaskGroup({
  title,
  projectId,
  sectionId,
  tasks: groupTasks,
  onDeleteSectionId,
}: {
  title: string;
  projectId: string;
  sectionId?: string;
  tasks: TaskRecord[];
  onDeleteSectionId?: string;
}) {
  const doneCount = groupTasks.filter((t) => t.completed).length;

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-zinc-900">{title}</h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {doneCount}/{groupTasks.length}
          </span>
        </div>
        {onDeleteSectionId && (
          <form action={deleteSection}>
            <input type="hidden" name="sectionId" value={onDeleteSectionId} />
            <button className="text-xs font-medium text-zinc-400 hover:text-red-600">Remove</button>
          </form>
        )}
      </header>

      {groupTasks.length > 0 ? (
        <ul className="divide-y divide-zinc-100">
          {groupTasks.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 px-5 py-3 transition hover:bg-zinc-50"
            >
              <form action={toggleTask}>
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="completed" value={String(t.completed)} />
                <button
                  aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                    t.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 hover:border-indigo-500"
                  }`}
                >
                  {t.completed ? "✓" : ""}
                </button>
              </form>

              <Link
                href={`/tasks/${t.id}`}
                className={`min-w-0 flex-1 truncate text-sm font-medium ${
                  t.completed ? "text-zinc-400 line-through" : "text-zinc-800 group-hover:text-indigo-700"
                }`}
              >
                {t.title}
              </Link>

              {t.dueDate && (
                <span className="hidden shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline">
                  {formatDue(t.dueDate)}
                </span>
              )}
              {t.assignee && (
                <span
                  title={t.assignee}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                >
                  {initials(t.assignee)}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-center text-sm text-zinc-400">No tasks here yet.</p>
      )}

      <form action={createTask} className="mt-auto flex items-center gap-2 border-t border-zinc-100 px-5 py-3">
        <input type="hidden" name="projectId" value={projectId} />
        {sectionId && <input type="hidden" name="sectionId" value={sectionId} />}
        <span className="text-lg leading-none text-zinc-400">+</span>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Add a task"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-zinc-400"
        />
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Add</button>
      </form>
    </section>
  );
}
