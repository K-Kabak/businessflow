import { ProfileForm } from "@/components/forms/resource-forms";
import { SettingsNav } from "@/components/settings/settings-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { requireUser } from "@/lib/auth-helpers";

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Profile settings"
        description="Manage your personal information."
        action={<SettingsNav admin={user.role === "ADMIN"} />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your email is managed by the organization and cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-muted rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">Email</span>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
          <ProfileForm
            initial={{ name: user.name, jobTitle: user.jobTitle ?? "" }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
