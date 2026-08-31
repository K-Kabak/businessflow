"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { loginAction } from "@/features/auth/actions";
import { signInSchema } from "@/lib/validations";

type LoginValues = z.infer<typeof signInSchema>;

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "admin@businessflow.local", password: "Demo123!" },
  });
  const submit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        if (result.fieldErrors)
          Object.entries(result.fieldErrors).forEach(([field, messages]) =>
            setError(field as keyof LoginValues, { message: messages[0] }),
          );
        toast.error(result.message);
      }
    }),
  );
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>
      <Button className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        Sign in
      </Button>
      <div className="grid grid-cols-2 gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setValue("email", "admin@businessflow.local");
            setValue("password", "Demo123!");
          }}
        >
          Use Admin Demo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setValue("email", "employee@businessflow.local");
            setValue("password", "Demo123!");
          }}
        >
          Use Employee Demo
        </Button>
      </div>
    </form>
  );
}
