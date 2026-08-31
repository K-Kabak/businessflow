import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-[background-color,border-color,color,opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_1px_2px_rgba(23,24,28,.12)]",
        secondary: "bg-muted text-foreground hover:bg-border",
        outline: "border bg-card hover:border-border-strong hover:bg-muted/70",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-danger text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 max-sm:h-11",
        sm: "h-8 px-3 text-xs max-sm:h-10",
        icon: "size-10 max-sm:size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
