import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { signUp } from "@/app/actions";
import { AuthForm } from "@/components/auth-form";

export const instant = false;

export default async function SignUpPage() {
  await connection();
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthForm mode="sign-up" action={signUp} />;
}
