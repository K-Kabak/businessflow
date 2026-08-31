"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormSetError,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { FormSection } from "@/components/ui/page";
import {
  saveClientAction,
  saveProjectAction,
  saveTaskAction,
  updateOrganizationAction,
  updateProfileAction,
} from "@/features/actions";
import {
  clientSchema,
  organizationSchema,
  profileSchema,
  projectSchema,
  taskSchema,
  type ClientInput,
  type ProjectInput,
  type TaskInput,
} from "@/lib/validations";

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

function applyServerErrors<T extends FieldValues>(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<T>,
) {
  if (!fieldErrors) return;
  Object.entries(fieldErrors).forEach(([field, messages]) =>
    setError(field as Path<T>, { message: messages[0] }),
  );
}

export function ClientForm({ initial }: { initial?: ClientInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: initial ?? {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      status: "ACTIVE",
    },
  });
  const submit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveClientAction(values);
      if (!result.success) {
        applyServerErrors<ClientInput>(result.fieldErrors, setError);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/clients/${result.data?.id}`);
      router.refresh();
    }),
  );
  return (
    <form onSubmit={submit}>
      <FormSection title="Identity" description="The client name and relationship status.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Client name" htmlFor="name" error={errors.name?.message} required><Input id="name" {...register("name")} /></Field>
          <Field label="Company" htmlFor="company" error={errors.company?.message}><Input id="company" {...register("company")} /></Field>
          <Field label="Status" htmlFor="status" error={errors.status?.message}><Select id="status" {...register("status")}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></Field>
        </div>
      </FormSection>
      <FormSection title="Contact" description="Primary contact details for this client.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" {...register("email")} /></Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}><Input id="phone" {...register("phone")} /></Field>
          <div className="sm:col-span-2"><Field label="Address" htmlFor="address" error={errors.address?.message}><Input id="address" {...register("address")} /></Field></div>
        </div>
      </FormSection>
      <FormSection title="Additional information" description="Internal context visible to your team.">
        <Field label="Notes" htmlFor="notes" error={errors.notes?.message}><Textarea id="notes" {...register("notes")} /></Field>
      </FormSection>
      <input type="hidden" {...register("id")} />
      <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <SubmitButton
          pending={pending}
          label={initial?.id ? "Save changes" : "Create client"}
        />
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

type ProjectOption = { id: string; name: string };
type MemberOption = { id: string; name: string; email: string };

export function ProjectForm({
  initial,
  clients,
  members,
}: {
  initial?: ProjectInput;
  clients: ProjectOption[];
  members: MemberOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial ?? {
      name: "",
      clientId: clients[0]?.id ?? "",
      description: "",
      status: "PLANNING",
      priority: "MEDIUM",
      budget: "",
      startDate: "",
      deadline: "",
      memberIds: [],
    },
  });
  const submit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveProjectAction(values);
      if (!result.success) {
        applyServerErrors<ProjectInput>(result.fieldErrors, setError);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/projects/${result.data?.id}`);
      router.refresh();
    }),
  );
  return (
    <form onSubmit={submit}>
      <FormSection title="Basics" description="Define the project and the client it belongs to.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Project name" htmlFor="name" error={errors.name?.message} required><Input id="name" {...register("name")} /></Field>
          <Field label="Client" htmlFor="clientId" error={errors.clientId?.message} required><Select id="clientId" {...register("clientId")}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <div className="sm:col-span-2"><Field label="Description" htmlFor="description" error={errors.description?.message}><Textarea id="description" {...register("description")} /></Field></div>
        </div>
      </FormSection>
      <FormSection title="Delivery" description="Set the current stage and relative urgency.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" error={errors.status?.message}><Select id="status" {...register("status")}><option value="PLANNING">Planning</option><option value="IN_PROGRESS">In progress</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></Select></Field>
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}><Select id="priority" {...register("priority")}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></Select></Field>
        </div>
      </FormSection>
      <FormSection title="Timeline & budget" description="Optional commercial and scheduling details.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Budget (PLN)" htmlFor="budget" error={errors.budget?.message}><Input id="budget" type="number" min="0" step="0.01" {...register("budget")} /></Field>
          <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}><Input id="startDate" type="date" {...register("startDate")} /></Field>
          <Field label="Deadline" htmlFor="deadline" error={errors.deadline?.message}><Input id="deadline" type="date" {...register("deadline")} /></Field>
        </div>
      </FormSection>
      <FormSection title="Team" description="Select organization members assigned to this project.">
        <Field label="Project members" htmlFor="memberIds" error={errors.memberIds?.message as string | undefined}>
          <div id="memberIds" className="grid overflow-hidden rounded-md border sm:grid-cols-2" role="group" aria-label="Project members">
            {members.map((member) => (
              <label key={member.id} className="hover:bg-muted flex min-h-12 cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 sm:nth-[odd]:border-r">
                <input type="checkbox" value={member.id} {...register("memberIds")} className="accent-primary size-4" />
                <span className="min-w-0"><span className="block text-[13px] font-medium">{member.name}</span><span className="text-muted-foreground block truncate text-[11px]">{member.email}</span></span>
              </label>
            ))}
          </div>
        </Field>
      </FormSection>
      <input type="hidden" {...register("id")} />
      <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <SubmitButton
          pending={pending}
          label={initial?.id ? "Save changes" : "Create project"}
        />
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

type TaskProjectOption = { id: string; name: string; members: MemberOption[] };

export function TaskForm({
  initial,
  projects,
}: {
  initial?: TaskInput;
  projects: TaskProjectOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? projects[0]?.id ?? "",
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: initial ?? {
      title: "",
      projectId,
      assigneeId: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      deadline: "",
    },
  });
  const project = projects.find((item) => item.id === projectId);
  const submit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveTaskAction(values);
      if (!result.success) {
        applyServerErrors<TaskInput>(result.fieldErrors, setError);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/tasks");
      router.refresh();
    }),
  );
  return (
    <form onSubmit={submit}>
      <FormSection title="Work details" description="Describe the task and the expected work.">
        <div className="grid gap-5"><Field label="Task title" htmlFor="title" error={errors.title?.message} required><Input id="title" {...register("title")} /></Field><Field label="Description" htmlFor="description" error={errors.description?.message}><Textarea id="description" {...register("description")} /></Field></div>
      </FormSection>
      <FormSection title="Assignment" description="Connect the task to a project and owner.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Project" htmlFor="projectId" error={errors.projectId?.message} required><Select id="projectId" {...register("projectId", { onChange: (event) => setProjectId(event.target.value) })}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Assignee" htmlFor="assigneeId" error={errors.assigneeId?.message}><Select id="assigneeId" {...register("assigneeId")}><option value="">Unassigned</option>{project?.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></Field>
        </div>
      </FormSection>
      <FormSection title="Schedule" description="Set workflow state, priority, and due date.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Status" htmlFor="status" error={errors.status?.message}><Select id="status" {...register("status")}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="REVIEW">Review</option><option value="DONE">Done</option></Select></Field>
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}><Select id="priority" {...register("priority")}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></Select></Field>
          <Field label="Deadline" htmlFor="deadline" error={errors.deadline?.message}><Input id="deadline" type="date" {...register("deadline")} /></Field>
        </div>
      </FormSection>
      <input type="hidden" {...register("id")} />
      <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <SubmitButton
          pending={pending}
          label={initial?.id ? "Save changes" : "Create task"}
        />
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; jobTitle: string };
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: initial });
  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await updateProfileAction(values);
          if (!result.success) {
            applyServerErrors(result.fieldErrors, setError);
            toast.error(result.message);
          } else toast.success(result.message);
        }),
      )}
      className="space-y-5"
    >
      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" {...register("name")} />
      </Field>
      <Field
        label="Job title"
        htmlFor="jobTitle"
        error={errors.jobTitle?.message}
      >
        <Input id="jobTitle" {...register("jobTitle")} />
      </Field>
      <SubmitButton pending={pending} label="Save profile" />
    </form>
  );
}

export function OrganizationForm({ initial }: { initial: { name: string } }) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: initial,
  });
  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await updateOrganizationAction(values);
          if (!result.success) {
            applyServerErrors(result.fieldErrors, setError);
            toast.error(result.message);
          } else toast.success(result.message);
        }),
      )}
      className="space-y-5"
    >
      <Field
        label="Organization name"
        htmlFor="name"
        error={errors.name?.message}
      >
        <Input id="name" {...register("name")} />
      </Field>
      <SubmitButton pending={pending} label="Save organization" />
    </form>
  );
}
