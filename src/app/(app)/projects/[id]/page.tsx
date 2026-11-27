import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, projects, sections, tasks, users } from "@/db/schema";
import { getProjectRole } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { parseUuid } from "@/lib/form";
import {
  addMember,
  createSection,
  createTask,
  deleteProject,
  deleteSection,
  removeMember,
  toggleTask,
  updateProject,
} from "@/app/actions";

export const instant = false;

const fieldClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; error?: string }>;
}) {
  await connection();
  const user = await requireUser();
  const { id: rawId } = await params;
  const { view, error } = await searchParams;

  const projectId = parseUuid(rawId);
  if (!projectId) notFound();

  // Non-members get a 404, so the existence of a project is not revealed.
  const role = await getProjectRole(projectId, user.id);
  if (!role) notFound();
  const isOwner = role === "owner";

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) notFound();

  const [projectSections, projectTasks, members] = await Promise.all([
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
    db
      .select({ id: users.id, name: users.name, email: users.email, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(users.name)),
  ]);

  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const topLevel = projectTasks.filter((t) => t.parentTaskId === null);
  const unsectioned = topLevel.filter((t) => t.sectionId === null);
  const done = topLevel.filter((t) => t.completed).length;
  const percent = topLevel.length === 0 ? 0 : Math.round((done / topLevel.length) * 100);
  const isBoard = view === "board";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-indigo-600">
          ← All projects
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            {isOwner ? (
              <form action={updateProject} className="grid gap-2">
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  name="name"
                  required
                  maxLength={200}
                  defaultValue={project.name}
                  className="rounded-lg border border-transparent px-1 text-3xl font-semibold tracking-tight text-zinc-900 outline-none transition hover:border-zinc-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <input
                  name="description"
                  maxLength={2000}
                  defaultValue={project.description ?? ""}
                  placeholder="Add a description"
                  className="rounded-lg border border-transparent px-1 text-zinc-600 outline-none transition hover:border-zinc-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <div>
                  <button className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                    Save details
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{project.name}</h1>
                {project.description && <p className="mt-2 text-zinc-600">{project.description}</p>}
              </>
            )}

            <div className="mt-5 flex items-center gap-4">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="whitespace-nowrap text-sm text-zinc-500">
                {done} of {topLevel.length} done · {percent}%
              </span>
            </div>
          </div>

          {isOwner && (
            <form action={deleteProject}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                Delete project
              </button>
            </form>
          )}
        </div>
      </section>

      <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 text-sm font-medium w-fit">
        <Link
          href={`/projects/${project.id}?view=list`}
          className={`rounded-md px-3 py-1.5 ${!isBoard ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
        >
          List
        </Link>
        <Link
          href={`/projects/${project.id}?view=board`}
          className={`rounded-md px-3 py-1.5 ${isBoard ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
        >
          Board
        </Link>
      </div>

      {isBoard ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[{ id: null as string | null, name: "No section" }, ...projectSections.map((s) => ({ id: s.id, name: s.name }))].map(
            (col) => {
              const colTasks = topLevel.filter((t) => (t.sectionId ?? null) === col.id);
              return (
                <div key={col.id ?? "none"} className="flex w-72 shrink-0 flex-col rounded-2xl bg-zinc-100/70 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold text-zinc-800">{col.name}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500">{colTasks.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {colTasks.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/tasks/${t.id}`}
                          className="block rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow"
                        >
                          <p className={`text-sm font-medium ${t.completed ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                            {t.title}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                            {t.dueDate && <span>{formatDue(t.dueDate)}</span>}
                            {t.assigneeId && memberName.get(t.assigneeId) && (
                              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                                {initials(memberName.get(t.assigneeId)!)}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <form action={createTask} className="mt-3 flex gap-2">
                    <input type="hidden" name="projectId" value={projectId} />
                    {col.id && <input type="hidden" name="sectionId" value={col.id} />}
                    <input name="title" required maxLength={200} placeholder="Add a task" className={`min-w-0 flex-1 ${fieldClass}`} />
                  </form>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {unsectioned.length > 0 && (
            <TaskGroup title="No section" projectId={project.id} tasks={unsectioned} allTasks={projectTasks} memberName={memberName} />
          )}
          {projectSections.map((s) => (
            <TaskGroup
              key={s.id}
              title={s.name}
              projectId={project.id}
              sectionId={s.id}
              tasks={topLevel.filter((t) => t.sectionId === s.id)}
              allTasks={projectTasks}
              memberName={memberName}
              onDeleteSectionId={s.id}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5">
          <h2 className="font-semibold text-zinc-900">Add section</h2>
          <form action={createSection} className="mt-3 flex gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input name="name" required maxLength={200} placeholder="Section name" className={`min-w-0 flex-1 ${fieldClass}`} />
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Add</button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Members <span className="font-normal text-zinc-400">({members.length})</span></h2>
          <ul className="mt-3 divide-y divide-zinc-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">{m.name}</p>
                  <p className="truncate text-xs text-zinc-500">{m.email}</p>
                </div>
                <span className="text-xs text-zinc-500">{m.role === "owner" ? "Owner" : "Member"}</span>
                {isOwner && m.role !== "owner" && (
                  <form action={removeMember}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="userId" value={m.id} />
                    <button className="text-xs font-medium text-zinc-400 hover:text-red-600">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <form action={addMember} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                placeholder="Invite by email"
                className={`min-w-0 flex-1 ${fieldClass}`}
              />
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Invite
              </button>
            </form>
          )}
          {isOwner && (
            <p className="mt-2 text-xs text-zinc-400">They need an account first. Only people you invite can see this project.</p>
          )}
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
  allTasks,
  memberName,
  onDeleteSectionId,
}: {
  title: string;
  projectId: string;
  sectionId?: string;
  tasks: TaskRecord[];
  allTasks: TaskRecord[];
  memberName: Map<string, string>;
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
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="sectionId" value={onDeleteSectionId} />
            <button className="text-xs font-medium text-zinc-400 hover:text-red-600">Remove</button>
          </form>
        )}
      </header>

      {groupTasks.length > 0 ? (
        <ul className="divide-y divide-zinc-100">
          {groupTasks.map((t) => {
            const subtasks = allTasks.filter((s) => s.parentTaskId === t.id);
            const subDone = subtasks.filter((s) => s.completed).length;
            const assignee = t.assigneeId ? memberName.get(t.assigneeId) : undefined;
            return (
              <li key={t.id} className="group px-5 py-3 transition hover:bg-zinc-50">
                <div className="flex items-center gap-3">
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

                  {subtasks.length > 0 && (
                    <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">
                      {subDone}/{subtasks.length}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="hidden shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline">
                      {formatDue(t.dueDate)}
                    </span>
                  )}
                  {assignee && (
                    <span
                      title={assignee}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                    >
                      {initials(assignee)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
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
