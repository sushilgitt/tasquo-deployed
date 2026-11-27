"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { comments, projects, sections, tasks } from "@/db/schema";
import { dateSchema, getOptional, getString, nameSchema, uuidSchema } from "@/lib/form";

// Invalid input throws, which Next.js shows as an error. Good enough for now;
// we can switch to returned field errors with useActionState later.

function requireUuid(value: string): string {
  return uuidSchema.parse(value);
}

function refreshAll() {
  // Lists and detail pages share data, so refresh the whole app.
  revalidatePath("/", "layout");
}

// ---------- Projects ----------

export async function createProject(formData: FormData) {
  const name = nameSchema.parse(getString(formData, "name"));
  const description = getOptional(formData, "description");

  const [project] = await db
    .insert(projects)
    .values({ name, description })
    .returning({ id: projects.id });

  // Give every new project the three standard sections.
  await db.insert(sections).values([
    { projectId: project.id, name: "To do", position: 0 },
    { projectId: project.id, name: "In progress", position: 1 },
    { projectId: project.id, name: "Done", position: 2 },
  ]);

  refreshAll();
  redirect(`/projects/${project.id}`);
}

export async function deleteProject(formData: FormData) {
  const id = requireUuid(getString(formData, "projectId"));
  await db.delete(projects).where(eq(projects.id, id));
  refreshAll();
  redirect("/");
}

// ---------- Sections ----------

export async function createSection(formData: FormData) {
  const projectId = requireUuid(getString(formData, "projectId"));
  const name = nameSchema.parse(getString(formData, "name"));

  const [{ maxPos }] = await db
    .select({ maxPos: max(sections.position) })
    .from(sections)
    .where(eq(sections.projectId, projectId));

  await db.insert(sections).values({
    projectId,
    name,
    position: (maxPos ?? -1) + 1,
  });

  refreshAll();
}

export async function deleteSection(formData: FormData) {
  const id = requireUuid(getString(formData, "sectionId"));
  // Tasks in the section are kept; their section is cleared (see schema onDelete).
  await db.delete(sections).where(eq(sections.id, id));
  refreshAll();
}

// ---------- Tasks ----------

export async function createTask(formData: FormData) {
  const projectId = requireUuid(getString(formData, "projectId"));
  const title = nameSchema.parse(getString(formData, "title"));
  const sectionIdRaw = getOptional(formData, "sectionId");

  await db.insert(tasks).values({
    projectId,
    title,
    sectionId: sectionIdRaw ? requireUuid(sectionIdRaw) : null,
  });

  refreshAll();
}

export async function toggleTask(formData: FormData) {
  const id = requireUuid(getString(formData, "taskId"));
  const completed = getString(formData, "completed") === "true";

  await db
    .update(tasks)
    .set({ completed: !completed, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  refreshAll();
}

export async function updateTask(formData: FormData) {
  const id = requireUuid(getString(formData, "taskId"));
  const title = nameSchema.parse(getString(formData, "title"));
  const description = getOptional(formData, "description");
  const assignee = getOptional(formData, "assignee");
  const dueRaw = getOptional(formData, "dueDate");
  const sectionRaw = getOptional(formData, "sectionId");

  await db
    .update(tasks)
    .set({
      title,
      description,
      assignee,
      dueDate: dueRaw ? dateSchema.parse(dueRaw) : null,
      sectionId: sectionRaw ? requireUuid(sectionRaw) : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id));

  refreshAll();
}

export async function deleteTask(formData: FormData) {
  const id = requireUuid(getString(formData, "taskId"));
  const projectId = requireUuid(getString(formData, "projectId"));
  await db.delete(tasks).where(eq(tasks.id, id));
  refreshAll();
  redirect(`/projects/${projectId}`);
}

// ---------- Comments ----------

export async function addComment(formData: FormData) {
  const taskId = requireUuid(getString(formData, "taskId"));
  const body = nameSchema.parse(getString(formData, "body"));
  const author = getOptional(formData, "author");

  await db.insert(comments).values({ taskId, body, author });
  refreshAll();
}

export async function deleteComment(formData: FormData) {
  const id = requireUuid(getString(formData, "commentId"));
  await db.delete(comments).where(eq(comments.id, id));
  refreshAll();
}
