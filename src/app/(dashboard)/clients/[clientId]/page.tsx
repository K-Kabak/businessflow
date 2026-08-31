import { ArrowLeft, Edit3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          <div className="flex items-center gap-2">
            <Badge value={client.status} />
          {user.role === "ADMIN" ? (
            <>
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
            </>
          ) : null}
          </div>
        }
      />
      <div className="grid overflow-hidden rounded-lg border bg-card lg:grid-cols-[360px_1fr]">
        <section className="border-b p-5 lg:border-r lg:border-b-0">
          <h2 className="text-sm font-semibold">Contact information</h2>
          <dl className="mt-4 space-y-4 text-[13px]">
            <div className="flex items-start gap-3"><Mail className="text-muted-foreground mt-0.5 size-4" /><div><dt className="text-muted-foreground text-[11px]">Email</dt><dd className="mt-0.5 break-all">{client.email ?? "Not provided"}</dd></div></div>
            <div className="flex items-start gap-3"><Phone className="text-muted-foreground mt-0.5 size-4" /><div><dt className="text-muted-foreground text-[11px]">Phone</dt><dd className="mt-0.5">{client.phone ?? "Not provided"}</dd></div></div>
            <div className="flex items-start gap-3"><MapPin className="text-muted-foreground mt-0.5 size-4" /><div><dt className="text-muted-foreground text-[11px]">Address</dt><dd className="mt-0.5">{client.address ?? "Not provided"}</dd></div></div>
          </dl>
          <div className="mt-5 border-t pt-5"><p className="text-muted-foreground text-[11px] font-medium">Notes</p><p className="mt-2 text-[13px] leading-6 whitespace-pre-wrap">{client.notes ?? "No notes added."}</p></div>
          <p className="text-muted-foreground mt-5 border-t pt-4 text-[11px]">Client since {formatDate(client.createdAt)}</p>
        </section>
        <section className="p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Projects</h2><span className="text-muted-foreground text-xs">{client.projects.length} total</span></div>
          {client.projects.length ? (
            <div className="overflow-hidden rounded-md border">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="hover:bg-muted/65 block border-b p-4 transition-colors last:border-0"
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
        </section>
      </div>
    </div>
  );
}
