"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations";
import type { ActionResult } from "@/types/actions";

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      code: "VALIDATION",
      message: "Check your sign-in details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError)
      return {
        success: false,
        code: "FORBIDDEN",
        message: "Invalid email or password.",
      };
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
