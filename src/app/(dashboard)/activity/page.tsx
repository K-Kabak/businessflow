import type { Prisma } from "@/generated/prisma/client";
import { Clock3, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import {
  EmptyState,
  FilterBar,
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
      <FilterBar>
      <form className="grid gap-2 sm:grid-cols-[200px_220px_auto]">
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
        <Button variant="secondary">Apply filters</Button>
      </form>
      {entity || actor ? <div className="mt-2 flex items-center border-t px-1 pt-2 text-xs"><span className="text-muted-foreground">Filters active</span><Link href="/activity" className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1"><X className="size-3" /> Clear</Link></div> : null}
      </FilterBar>
      {logs.length ? (
        <>
          <div className="hidden md:block"><TableShell>
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
          </TableShell></div>
          <div className="rounded-lg border bg-card px-4 md:hidden">
            {logs.map((log) => (
              <div key={log.id} className="relative border-b py-4 pl-6 last:border-0 before:absolute before:top-5 before:left-0 before:size-2 before:rounded-full before:bg-primary">
                <p className="text-[13px] leading-5">{log.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><Badge value={log.action} /><Badge value={log.entityType} /></div>
                <p className="text-muted-foreground mt-2 flex items-center gap-1 text-[11px]"><span>{log.user?.name ?? "System"}</span><span>·</span><Clock3 className="size-3" />{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
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
