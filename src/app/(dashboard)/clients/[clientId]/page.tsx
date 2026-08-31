import { ArrowLeft, Edit3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { deleteClientAction } from "@/features/actions";
import { clientScope, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, ...clientScope(user) },
    include: {
      projects: {
        where:
          user.role === "EMPLOYEE"
            ? { members: { some: { userId: user.id } } }
            : {},
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { tasks: true } } },
      },
    },
  });
  if (!client) notFound();
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </Button>
      <PageHeader
        title={client.name}
        description={client.company ?? "Client details"}
        action={
          user.role === "ADMIN" ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/clients/${client.id}/edit`}>
                  <Edit3 className="size-4" />
                  Edit
                </Link>
              </Button>
              <DeleteButton
                label={`Delete ${client.name}?`}
                description="This cannot be undone. Deletion is blocked while the client has projects."
                action={deleteClientAction.bind(null, client.id)}
                redirectTo="/clients"
              />
            </div>
          ) : undefined
        }
      />
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contact information</CardTitle>
              <Badge value={client.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="flex items-center gap-3">
              <Mail className="text-muted-foreground size-4" />
              {client.email ?? "No email"}
            </p>
            <p className="flex items-center gap-3">
              <Phone className="text-muted-foreground size-4" />
              {client.phone ?? "No phone"}
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-0.5 size-4" />
              {client.address ?? "No address"}
            </p>
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                {client.notes ?? "No notes added."}
              </p>
            </div>
            <p className="text-muted-foreground border-t pt-4 text-xs">
              Client since {formatDate(client.createdAt)}
            </p>
          </CardContent>
        </Card>
        <div>
          <h2 className="mb-3 font-semibold">Projects</h2>
          {client.projects.length ? (
            <div className="grid gap-3">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-card hover:border-primary/40 rounded-xl border p-4 shadow-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{project.name}</p>
                    <Badge value={project.status} />
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {project._count.tasks} tasks · Due{" "}
                    {formatDate(project.deadline)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No projects"
              description="This client has no visible projects yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}
