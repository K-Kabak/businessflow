import { ClientForm } from "@/components/forms/resource-forms";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add client"
        description="Create a client record for your organization."
      />
      <section className="rounded-lg border bg-card p-5 sm:p-6"><ClientForm /></section>
    </div>
  );
}
