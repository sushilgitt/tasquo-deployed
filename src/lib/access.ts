import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, tasks } from "@/db/schema";

export type Role = "owner" | "member";

/** The user's role in a project, or null if they are not a member. */
export async function getProjectRole(projectId: string, userId: string): Promise<Role | null> {
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

/** For server actions: throws unless the user is a member. Returns their role. */
export async function assertMember(projectId: string, userId: string): Promise<Role> {
  const role = await getProjectRole(projectId, userId);
  if (!role) throw new Error("You do not have access to this project.");
  return role;
}

/** For server actions: throws unless the user owns the project. */
export async function assertOwner(projectId: string, userId: string): Promise<void> {
  const role = await assertMember(projectId, userId);
  if (role !== "owner") throw new Error("Only the project owner can do that.");
}

/** Looks up a task's project so actions can check access before changing anything. */
export async function assertTaskMember(
  taskId: string,
  userId: string,
): Promise<{ projectId: string; role: Role }> {
  const [task] = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!task) throw new Error("Task not found.");
  const role = await assertMember(task.projectId, userId);
  return { projectId: task.projectId, role };
}
