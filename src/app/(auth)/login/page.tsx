import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.12),transparent_40%)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center pb-2 text-center">
          <span className="bg-primary text-primary-foreground mb-3 flex size-11 items-center justify-center rounded-xl">
            <BriefcaseBusiness className="size-5" />
          </span>
          <CardTitle className="text-2xl">Welcome to BusinessFlow</CardTitle>
          <CardDescription>
            Sign in to manage your organization&apos;s work.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <LoginForm />
          <div className="bg-muted text-muted-foreground mt-6 rounded-lg p-3 text-xs">
            <p className="text-foreground font-medium">
              Demo password: Demo123!
            </p>
            <p className="mt-1">
              Use either demo account to compare role-based access.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
