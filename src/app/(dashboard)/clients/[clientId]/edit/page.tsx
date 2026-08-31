import { notFound } from "next/navigation";
import { ClientForm } from "@/components/forms/resource-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireAdmin();
  const { clientId } = await params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: user.organizationId },
  });
  if (!client) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${client.name}`}
        description="Update client details and status."
      />
      <Card>
        <CardHeader>
          <CardTitle>Client details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            initial={{
              id: client.id,
              name: client.name,
              company: client.company ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              address: client.address ?? "",
              notes: client.notes ?? "",
              status: client.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
