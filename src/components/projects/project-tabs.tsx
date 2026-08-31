"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";

type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  assignee: { name: string } | null;
};
type ActivityItem = {
  id: string;
  description: string;
  createdAt: string;
  entityType: string;
  user: { name: string } | null;
};

function TabTrigger({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className="text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground border-b-2 border-transparent px-1 pb-3 text-sm font-medium"
    >
      {children}
    </Tabs.Trigger>
  );
}

export function ProjectTabs({
  description,
  tasks,
  activity,
  canManage,
}: {
  description: string | null;
  tasks: TaskItem[];
  activity: ActivityItem[];
  canManage: boolean;
}) {
  return (
    <Tabs.Root defaultValue="overview">
      <Tabs.List className="flex gap-6 border-b">
        <TabTrigger value="overview">Overview</TabTrigger>
        <TabTrigger value="tasks">Tasks ({tasks.length})</TabTrigger>
        <TabTrigger value="activity">Activity</TabTrigger>
      </Tabs.List>
      <Tabs.Content value="overview" className="py-5">
        <h3 className="text-sm font-semibold">Description</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
          {description || "No description added."}
        </p>
      </Tabs.Content>
      <Tabs.Content value="tasks" className="py-5">
        {tasks.length ? (
          <div className="divide-y rounded-xl border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Due {formatDate(task.deadline)}
                  </p>
                </div>
                <Badge value={task.priority} />
                <Badge value={task.status} />
                {task.assignee ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Avatar name={task.assignee.name} size="sm" />
                    {task.assignee.name}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Unassigned
                  </span>
                )}
                {canManage ? (
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="text-primary text-sm font-medium"
                  >
                    Edit
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No tasks in this project.
          </p>
        )}
      </Tabs.Content>
      <Tabs.Content value="activity" className="py-5">
        {activity.length ? (
          <div className="divide-y">
            {activity.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-sm">{item.description}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.user?.name ?? "System"}
                  </p>
                </div>
                <time className="text-muted-foreground text-xs">
                  {formatDate(item.createdAt)}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No project activity yet.
          </p>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
