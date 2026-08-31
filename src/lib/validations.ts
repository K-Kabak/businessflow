import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email.")
  .optional()
  .or(z.literal(""));
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .optional()
  .or(z.literal(""));

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(72),
});

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required.").max(100),
  company: optionalText(100),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(240),
  notes: optionalText(2000),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const projectSchema = z
  .object({
    id: z.string().optional(),
    clientId: z.string().min(1, "Select a client."),
    name: z.string().trim().min(2, "Name is required.").max(140),
    description: optionalText(4000),
    status: z.enum([
      "PLANNING",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    budget: z.string().trim().optional().or(z.literal("")),
    startDate: optionalDate,
    deadline: optionalDate,
    memberIds: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (
      value.budget &&
      (!Number.isFinite(Number(value.budget)) || Number(value.budget) < 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Budget must be zero or greater.",
      });
    }
    if (value.startDate && value.deadline && value.deadline < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["deadline"],
        message: "Deadline cannot precede the start date.",
      });
    }
  });

export const taskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "Select a project."),
  assigneeId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Title is required.").max(180),
  description: optionalText(4000),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: optionalDate,
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  destinationStatus: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  beforeTaskId: z.string().nullable().optional(),
  afterTaskId: z.string().nullable().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(100),
  jobTitle: optionalText(100),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required.").max(120),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
