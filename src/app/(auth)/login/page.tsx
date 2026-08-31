import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-16">
      <header className="absolute top-0 right-0 left-0 flex h-16 items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]"><span className="bg-foreground text-background grid size-7 place-items-center rounded-md text-[10px] font-bold">BF</span>BusinessFlow</div>
        <ThemeToggle />
      </header>
      <section className="w-full max-w-[380px]">
          <div className="mb-8"><p className="text-muted-foreground mb-2 text-xs font-medium">Workspace access</p><h1 className="text-2xl font-semibold tracking-[-0.025em]">Welcome back</h1><p className="text-muted-foreground mt-2 text-sm">Sign in to manage your organization&apos;s work.</p></div>
          <LoginForm />
          <div className="text-muted-foreground mt-6 border-t pt-5 text-xs">
            <p className="text-foreground font-medium">
              Demo password: Demo123!
            </p>
            <p className="mt-1">
              Use either demo account to compare role-based access.
            </p>
          </div>
      </section>
    </main>
  );
}
