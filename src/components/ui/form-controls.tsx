import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-md border bg-card px-3 text-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/75 hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 max-sm:h-11";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}
export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "bg-card placeholder:text-muted-foreground/75 hover:border-border-strong focus-visible:border-primary min-h-28 w-full rounded-md border px-3 py-2.5 text-sm leading-5 transition-colors focus-visible:outline-2",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-describedby"?: string;
          "aria-invalid"?: boolean;
        }>,
        {
          "aria-describedby": describedBy,
          "aria-invalid": Boolean(error) || undefined,
        },
      )
    : children;
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p
          id={descriptionId}
          className="text-muted-foreground text-xs leading-4"
        >
          {description}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-danger text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
