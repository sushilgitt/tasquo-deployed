"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { comments, projectMembers, projects, sections, tasks, users } from "@/db/schema";
import { hashPassword, requireUser, startSession, endSession, verifyPassword } from "@/lib/auth";
import { assertMember, assertOwner, assertTaskMember, getProjectRole } from "@/lib/access";
import { dateSchema, getOptional, getString, nameSchema, uuidSchema } from "@/lib/form";

// Auth forms return an error message for useActionState. Everything else throws
// on bad input (shown as an error page) or redirects back with ?error=... for member actions.

export type AuthState = { error?: string };

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

function requireUuid(value: string): string {
  return uuidSchema.parse(value);
}

function refreshAll() {
  // Lists and detail pages share data, so refresh the whole app.
  revalidatePath("/", "layout");
}

/** Sends the user back to the project with a message (used for member-management errors). */
function backToProject(projectId: string, message: string): never {
  redirect(`/projects/${projectId}?error=${encodeURIComponent(message)}`);
}

// ---------- Accounts ----------

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { name, email, password } = parsed.data;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });

  await startSession(user.id);
  redirect("/dashboard");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: getString(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Same message for unknown email and wrong password, so accounts can't be probed.
  const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!ok) return { error: "Email or password is incorrect." };

  await startSession(user.id);
  redirect("/dashboard");
}

export async function signOut() {
  await endSession();
  redirect("/sign-in");
}

// ---------- Projects ----------

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const name = nameSchema.parse(getString(formData, "name"));
  const description = getOptional(formData, "description");

  const [project] = await db
    .insert(projects)
    .values({ name, description, ownerId: user.id })
    .returning({ id: projects.id });

  await db.insert(projectMembers).values({ projectId: project.id, userId: user.id, role: "owner" });

  // Give every new project the three standard sections.
  await db.insert(sections).values([
    { projectId: project.id, name: "To do", position: 0 },
    { projectId: project.id, name: "In progress", position: 1 },
    { projectId: project.id, name: "Done", position: 2 },
  ]);

  refreshAll();
  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  await assertMember(projectId, user.id);

  const name = nameSchema.parse(getString(formData, "name"));
  const description = getOptional(formData, "description");

  await db
    .update(projects)
    .set({ name, description, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  refreshAll();
}

export async function deleteProject(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  await assertOwner(projectId, user.id);

  await db.delete(projects).where(eq(projects.id, projectId));
  refreshAll();
  redirect("/dashboard");
}

// ---------- Members ----------

export async function addMember(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  await assertOwner(projectId, user.id);

  const email = getString(formData, "email").toLowerCase();
  if (!z.email().safeParse(email).success) backToProject(projectId, "Enter a valid email address.");

  const [invitee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!invitee) backToProject(projectId, "No account exists for that email yet. Ask them to sign up first.");

  await db
    .insert(projectMembers)
    .values({ projectId, userId: invitee.id, role: "member" })
    .onConflictDoNothing();

  refreshAll();
  redirect(`/projects/${projectId}`);
}

export async function removeMember(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  const memberId = requireUuid(getString(formData, "userId"));
  await assertOwner(projectId, user.id);

  if ((await getProjectRole(projectId, memberId)) === "owner") {
    backToProject(projectId, "The owner can't be removed from their own project.");
  }

  // Unassign their tasks in this project before removing them.
  await db
    .update(tasks)
    .set({ assigneeId: null })
    .where(and(eq(tasks.projectId, projectId), eq(tasks.assigneeId, memberId)));
  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));

  refreshAll();
  redirect(`/projects/${projectId}`);
}

// ---------- Sections ----------

export async function createSection(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  await assertMember(projectId, user.id);

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
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  const id = requireUuid(getString(formData, "sectionId"));
  await assertMember(projectId, user.id);

  // Tasks in the section are kept; their section is cleared (see schema onDelete).
  await db
    .delete(sections)
    .where(and(eq(sections.id, id), eq(sections.projectId, projectId)));
  refreshAll();
}

// ---------- Tasks ----------

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const projectId = requireUuid(getString(formData, "projectId"));
  await assertMember(projectId, user.id);

  const title = nameSchema.parse(getString(formData, "title"));
  const sectionIdRaw = getOptional(formData, "sectionId");
  const parentRaw = getOptional(formData, "parentTaskId");

  let parentTaskId: string | null = null;
  if (parentRaw) {
    // A subtask must belong to the same project as its parent.
    const { projectId: parentProject } = await assertTaskMember(requireUuid(parentRaw), user.id);
    if (parentProject !== projectId) throw new Error("Parent task is in another project.");
    parentTaskId = requireUuid(parentRaw);
  }

  await db.insert(tasks).values({
    projectId,
    title,
    parentTaskId,
    sectionId: sectionIdRaw ? requireUuid(sectionIdRaw) : null,
  });

  refreshAll();
}

export async function toggleTask(formData: FormData) {
  const user = await requireUser();
  const id = requireUuid(getString(formData, "taskId"));
  await assertTaskMember(id, user.id);
  const completed = getString(formData, "completed") === "true";

  await db
    .update(tasks)
    .set({ completed: !completed, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  refreshAll();
}

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const id = requireUuid(getString(formData, "taskId"));
  const { projectId } = await assertTaskMember(id, user.id);

  const title = nameSchema.parse(getString(formData, "title"));
  const description = getOptional(formData, "description");
  const assigneeRaw = getOptional(formData, "assigneeId");
  const dueRaw = getOptional(formData, "dueDate");
  const sectionRaw = getOptional(formData, "sectionId");

  let assigneeId: string | null = null;
  if (assigneeRaw) {
    // Only project members can be assigned.
    assigneeId = requireUuid(assigneeRaw);
    if (!(await getProjectRole(projectId, assigneeId))) {
      throw new Error("Assignee must be a member of this project.");
    }
  }

  let sectionId: string | null = null;
  if (sectionRaw) {
    sectionId = requireUuid(sectionRaw);
    const [section] = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)))
      .limit(1);
    if (!section) throw new Error("Section is not in this project.");
  }

  await db
    .update(tasks)
    .set({
      title,
      description,
      assigneeId,
      dueDate: dueRaw ? dateSchema.parse(dueRaw) : null,
      sectionId,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id));

  refreshAll();
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser();
  const id = requireUuid(getString(formData, "taskId"));
  const { projectId } = await assertTaskMember(id, user.id);

  await db.delete(tasks).where(eq(tasks.id, id));
  refreshAll();
  redirect(`/projects/${projectId}`);
}

// ---------- Comments ----------

export async function addComment(formData: FormData) {
  const user = await requireUser();
  const taskId = requireUuid(getString(formData, "taskId"));
  await assertTaskMember(taskId, user.id);

  const body = nameSchema.parse(getString(formData, "body"));

  await db.insert(comments).values({ taskId, body, author: user.name, authorId: user.id });
  refreshAll();
}

export async function deleteComment(formData: FormData) {
  const user = await requireUser();
  const id = requireUuid(getString(formData, "commentId"));

  const [comment] = await db
    .select({ taskId: comments.taskId, authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  if (!comment) throw new Error("Comment not found.");

  // Authors can delete their own comments; project owners can delete any.
  const { role } = await assertTaskMember(comment.taskId, user.id);
  if (comment.authorId !== user.id && role !== "owner") {
    throw new Error("You can only delete your own comments.");
  }

  await db.delete(comments).where(eq(comments.id, id));
  refreshAll();
}
