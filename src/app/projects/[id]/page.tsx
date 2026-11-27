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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← All projects
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
          {project.description && <p className="text-zinc-600">{project.description}</p>}
        </div>
        <form action={deleteProject}>
          <input type="hidden" name="projectId" value={project.id} />
          <button className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            Delete project
          </button>
        </form>
      </div>

      {/* Tasks with no section */}
      {unsectioned.length > 0 && (
        <TaskGroup title="No section" projectId={project.id} tasks={unsectioned} sections={projectSections} />
      )}

      {projectSections.map((s) => (
        <TaskGroup
          key={s.id}
          title={s.name}
          projectId={project.id}
          sectionId={s.id}
          tasks={projectTasks.filter((t) => t.sectionId === s.id)}
          sections={projectSections}
          onDeleteSectionId={s.id}
        />
      ))}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Add section</h2>
        <form action={createSection} className="mt-3 flex gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="name"
            required
            maxLength={200}
            placeholder="Section name"
            className="flex-1 rounded border border-zinc-300 px-3 py-2"
          />
          <button className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">Add</button>
        </form>
      </section>
    </div>
  );
}

type TaskRecord = typeof tasks.$inferSelect;
type SectionRecord = typeof sections.$inferSelect;

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
  sections: SectionRecord[];
  onDeleteSectionId?: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
        <h2 className="font-semibold">
          {title} <span className="text-sm font-normal text-zinc-500">({groupTasks.length})</span>
        </h2>
        {onDeleteSectionId && (
          <form action={deleteSection}>
            <input type="hidden" name="sectionId" value={onDeleteSectionId} />
            <button className="text-sm text-zinc-500 hover:text-red-700">Remove section</button>
          </form>
        )}
      </header>

      {groupTasks.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {groupTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2">
              <form action={toggleTask}>
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="completed" value={String(t.completed)} />
                <button
                  aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                  className="flex h-5 w-5 items-center justify-center rounded border border-zinc-400 text-xs"
                >
                  {t.completed ? "✓" : ""}
                </button>
              </form>
              <Link
                href={`/tasks/${t.id}`}
                className={`flex-1 hover:underline ${t.completed ? "text-zinc-400 line-through" : ""}`}
              >
                {t.title}
              </Link>
              {t.assignee && <span className="text-sm text-zinc-500">{t.assignee}</span>}
              {t.dueDate && <span className="text-sm text-zinc-500">due {t.dueDate}</span>}
            </li>
          ))}
        </ul>
      )}

      <form action={createTask} className="flex gap-2 border-t border-zinc-100 px-4 py-2">
        <input type="hidden" name="projectId" value={projectId} />
        {sectionId && <input type="hidden" name="sectionId" value={sectionId} />}
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Add a task…"
          className="flex-1 rounded px-2 py-1 text-sm outline-none focus:bg-zinc-50"
        />
        <button className="text-sm text-zinc-600 hover:text-zinc-900">Add</button>
      </form>
    </section>
  );
}
