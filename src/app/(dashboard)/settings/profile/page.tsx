import type { Metadata } from "next";
import { ProfileForm } from "@/components/forms/resource-forms";
import { SettingsNav } from "@/components/settings/settings-nav";
import { PageHeader } from "@/components/ui/page";
import { requireUser } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile settings"
        description="Manage your personal information."
      />
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,720px)]">
        <SettingsNav admin={user.role === "ADMIN"} />
        <section className="bg-card rounded-lg border p-5 sm:p-6">
          <div className="border-b pb-5">
            <h2 className="text-base font-semibold">Profile</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Your email is managed by the organization and cannot be changed.
            </p>
          </div>
          <dl className="border-b py-5">
            <dt className="text-muted-foreground text-xs">Email address</dt>
            <dd className="mt-1 text-[13px] font-medium">{user.email}</dd>
          </dl>
          <div className="pt-5">
            <ProfileForm
              initial={{ name: user.name, jobTitle: user.jobTitle ?? "" }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
