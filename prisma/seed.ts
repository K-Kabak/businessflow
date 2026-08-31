import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

import {
  PrismaClient,
  type ProjectPriority,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "";
if (!connectionString) throw new Error("DATABASE_URL is not configured.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const clientNames = [
  "Nova Studio",
  "Bright Agency",
  "Pixel Corp",
  "Northstar Labs",
  "Studio Vertex",
  "Orbit Media",
  "Maven Works",
  "Peak Digital",
];
const projectDefinitions: Array<{
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  deadline: Date;
}> = [
  {
    name: "Website Redesign",
    status: "IN_PROGRESS",
    priority: "HIGH",
    budget: 42000,
    deadline: addDays(new Date(), 21),
  },
  {
    name: "Marketing Campaign",
    status: "PLANNING",
    priority: "MEDIUM",
    budget: 18000,
    deadline: addDays(new Date(), 35),
  },
  {
    name: "CRM Integration",
    status: "ON_HOLD",
    priority: "HIGH",
    budget: 67000,
    deadline: addDays(new Date(), 50),
  },
  {
    name: "Brand Identity",
    status: "COMPLETED",
    priority: "MEDIUM",
    budget: 14000,
    deadline: subDays(new Date(), 18),
  },
  {
    name: "E-commerce Launch",
    status: "IN_PROGRESS",
    priority: "HIGH",
    budget: 86000,
    deadline: addDays(new Date(), 14),
  },
  {
    name: "SEO Campaign",
    status: "COMPLETED",
    priority: "LOW",
    budget: 12000,
    deadline: subDays(new Date(), 30),
  },
  {
    name: "Client Portal",
    status: "PLANNING",
    priority: "MEDIUM",
    budget: 54000,
    deadline: addDays(new Date(), 60),
  },
  {
    name: "Analytics Dashboard",
    status: "IN_PROGRESS",
    priority: "HIGH",
    budget: 39000,
    deadline: addDays(new Date(), 28),
  },
];

const taskTitles = [
  "Create landing page",
  "Implement authentication",
  "Prepare dashboard layout",
  "Build client table",
  "Review mobile navigation",
  "Create campaign assets",
  "Set up database schema",
  "Configure analytics tracking",
  "Write content brief",
  "Map customer journey",
  "Design component library",
  "Run accessibility audit",
  "Prepare launch checklist",
  "Connect CRM webhooks",
  "Review API contract",
  "Build checkout flow",
  "Optimize image delivery",
  "Plan keyword clusters",
  "Draft client report",
  "Create portal wireframes",
  "Implement project timeline",
  "Add export controls",
  "Verify event taxonomy",
  "Create KPI cards",
  "Test responsive tables",
  "Review stakeholder feedback",
  "Prepare handoff notes",
  "Configure deployment",
  "Polish empty states",
  "Run final QA",
];

async function main() {
  await prisma.organization.deleteMany({
    where: {
      slug: {
        in: ["acme-creative-studio", "e2e-foreign-organization"],
      },
    },
  });
  const passwordHash = await bcrypt.hash("Demo123!", 12);
  const organization = await prisma.organization.create({
    data: { name: "Acme Creative Studio", slug: "acme-creative-studio" },
  });
  const [admin, employee] = await Promise.all([
    prisma.user.create({
      data: {
        organizationId: organization.id,
        name: "Anna Kowalska",
        email: "admin@businessflow.local",
        passwordHash,
        role: "ADMIN",
        jobTitle: "Managing Director",
      },
    }),
    prisma.user.create({
      data: {
        organizationId: organization.id,
        name: "Marek Nowak",
        email: "employee@businessflow.local",
        passwordHash,
        role: "EMPLOYEE",
        jobTitle: "Product Designer",
      },
    }),
  ]);
  const clients = await Promise.all(
    clientNames.map((name, index) =>
      prisma.client.create({
        data: {
          organizationId: organization.id,
          name,
          company: index % 2 ? name : `${name} Sp. z o.o.`,
          email: `hello@${name.toLowerCase().replaceAll(" ", "")}.example`,
          phone: `+48 500 10${index} 20${index}`,
          address: `${10 + index} Długa Street, Warsaw`,
          notes:
            index % 3 === 0
              ? "Strategic account with quarterly planning reviews."
              : null,
          status: index === 6 ? "INACTIVE" : "ACTIVE",
        },
      }),
    ),
  );
  const projects = [];
  for (let index = 0; index < projectDefinitions.length; index += 1) {
    const definition = projectDefinitions[index];
    const project = await prisma.project.create({
      data: {
        organizationId: organization.id,
        clientId: clients[index].id,
        ...definition,
        description: `Delivery plan for ${definition.name.toLowerCase()}, including discovery, implementation, review, and handoff.`,
        startDate: subDays(new Date(), 10 + index * 3),
      },
    });
    if (index !== 3 && index !== 5) {
      await prisma.projectMember.create({
        data: {
          organizationId: organization.id,
          projectId: project.id,
          userId: employee.id,
        },
      });
    }
    projects.push(project);
  }
  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
  const priorities: TaskPriority[] = ["MEDIUM", "HIGH", "LOW", "URGENT"];
  const positions: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
  };
  const tasks = [];
  for (let index = 0; index < taskTitles.length; index += 1) {
    const project = projects[index % projects.length];
    const status: TaskStatus =
      project.status === "COMPLETED"
        ? "DONE"
        : statuses[index % statuses.length];
    positions[status] += 1000;
    const deadline =
      index === 0
        ? subDays(new Date(), 5)
        : index === 1
          ? subDays(new Date(), 2)
          : addDays(new Date(), 2 + index);
    const task = await prisma.task.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        assigneeId:
          project.status === "COMPLETED" || index % 5 === 0
            ? null
            : employee.id,
        title: taskTitles[index],
        description: `Complete ${taskTitles[index].toLowerCase()} and share the result with the project team.`,
        status,
        priority: priorities[index % priorities.length],
        deadline,
        position: positions[status],
      },
    });
    tasks.push(task);
  }
  await prisma.activityLog.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: admin.id,
        entityType: "ORGANIZATION",
        entityId: organization.id,
        action: "CREATED",
        description:
          "Anna Kowalska created the Acme Creative Studio workspace.",
      },
      ...clients.slice(0, 4).map((client) => ({
        organizationId: organization.id,
        userId: admin.id,
        entityType: "CLIENT" as const,
        entityId: client.id,
        action: "CREATED" as const,
        description: `Anna Kowalska created client “${client.name}”.`,
      })),
      ...projects.slice(0, 4).map((project) => ({
        organizationId: organization.id,
        userId: admin.id,
        entityType: "PROJECT" as const,
        entityId: project.id,
        action: "CREATED" as const,
        description: `Anna Kowalska created project “${project.name}”.`,
      })),
      ...tasks.slice(0, 5).map((task, index) => ({
        organizationId: organization.id,
        userId: index % 2 ? employee.id : admin.id,
        entityType: "TASK" as const,
        entityId: task.id,
        action: index % 2 ? ("STATUS_CHANGED" as const) : ("CREATED" as const),
        description:
          index % 2
            ? `Marek Nowak moved task “${task.title}” to ${task.status}.`
            : `Anna Kowalska created task “${task.title}”.`,
        metadata: { projectId: task.projectId },
      })),
    ],
  });
  if (connectionString.includes("businessflow_e2e")) {
    await prisma.organization.create({
      data: {
        id: "e2e_foreign_organization",
        name: "Foreign E2E Organization",
        slug: "e2e-foreign-organization",
        clients: {
          create: {
            id: "e2e_foreign_client",
            name: "Foreign E2E Client",
          },
        },
      },
    });
  }
  console.info(
    `Seeded ${clients.length} clients, ${projects.length} projects, and ${tasks.length} tasks.`,
  );
}

main().finally(async () => prisma.$disconnect());
