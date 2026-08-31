import type { Metadata } from "next";
import { OrganizationForm } from "@/components/forms/resource-forms";
import { SettingsNav } from "@/components/settings/settings-nav";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Organization settings" };

export default async function OrganizationSettingsPage() {
  const user = await requireAdmin();
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization settings"
        description="Manage your BusinessFlow workspace."
      />
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,720px)]">
        <SettingsNav admin />
        <section className="bg-card rounded-lg border p-5 sm:p-6">
          <div className="border-b pb-5">
            <h2 className="text-base font-semibold">Organization</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Manage the identity of this workspace.
            </p>
          </div>
          <div className="py-5">
            <OrganizationForm initial={{ name: organization.name }} />
          </div>
          <dl className="border-t pt-5">
            <dt className="text-muted-foreground text-xs">
              Workspace slug · read only
            </dt>
            <dd className="mt-1 font-mono text-xs">{organization.slug}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
