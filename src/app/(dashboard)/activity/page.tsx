import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import {
  EmptyState,
  PageHeader,
  TableShell,
  tdClass,
  thClass,
} from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { activityScope } from "@/lib/activity-scope";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  PAGE_SIZE,
  pageParam,
  param,
  type SearchParams,
} from "@/lib/search-params";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const entity = param(query.entity);
  const actor = param(query.user);
  const page = pageParam(query.page);
  const baseScope = await activityScope(user);
  const validEntities = [
    "CLIENT",
    "PROJECT",
    "TASK",
    "USER",
    "ORGANIZATION",
  ] as const;
  const where: Prisma.ActivityLogWhereInput = {
    AND: [
      baseScope,
      ...(validEntities.includes(entity as (typeof validEntities)[number])
        ? [{ entityType: entity as (typeof validEntities)[number] }]
        : []),
      ...(actor ? [{ userId: actor }] : []),
    ],
  };
  const [logs, total, users] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.activityLog.count({ where }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A read-only audit trail for the work you can access."
      />
      <form className="grid gap-3 sm:grid-cols-[200px_220px_auto]">
        <Select name="entity" defaultValue={entity}>
          <option value="">All entities</option>
          {validEntities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select name="user" defaultValue={actor}>
          <option value="">All actors</option>
          {users.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
        <Button variant="outline">Apply filters</Button>
      </form>
      {logs.length ? (
        <>
          <TableShell>
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className={thClass}>Actor</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Description</th>
                  <th className={thClass}>Entity</th>
                  <th className={thClass}>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className={tdClass}>{log.user?.name ?? "System"}</td>
                    <td className={tdClass}>
                      <Badge value={log.action} />
                    </td>
                    <td className={tdClass}>{log.description}</td>
                    <td className={tdClass}>
                      <Badge value={log.entityType} />
                    </td>
                    <td className={tdClass}>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            path="/activity"
            params={{ entity, user: actor }}
          />
        </>
      ) : (
        <EmptyState
          title="No activity found"
          description="There are no audit entries matching these filters."
        />
      )}
    </div>
  );
}
