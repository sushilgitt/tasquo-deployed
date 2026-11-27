"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/actions";

type Props = {
  mode: "sign-in" | "sign-up";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "sign-up";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white">
          T
        </span>
        <span className="text-lg font-semibold tracking-tight">Tasque</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {isSignUp ? "Start planning projects and tracking tasks." : "Sign in to continue to your projects."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {isSignUp && (
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Full name</span>
            <input name="name" required maxLength={100} autoComplete="name" className={inputClass} />
          </label>
        )}

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={inputClass}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={isSignUp ? 8 : undefined}
            maxLength={200}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={isSignUp ? "At least 8 characters" : undefined}
            className={inputClass}
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isSignUp ? "Already have an account? " : "New to Tasque? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-indigo-600 hover:text-indigo-800"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
