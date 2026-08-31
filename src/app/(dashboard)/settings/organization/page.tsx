import { OrganizationForm } from "@/components/forms/resource-forms";
import { SettingsNav } from "@/components/settings/settings-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export default async function OrganizationSettingsPage() {
  const user = await requireAdmin();
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Organization settings"
        description="Manage your BusinessFlow workspace."
        action={<SettingsNav admin />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            The workspace slug is read-only in this MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <OrganizationForm initial={{ name: organization.name }} />
          <div className="bg-muted rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">Slug</span>
            <p className="mt-1 font-mono text-xs">{organization.slug}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
