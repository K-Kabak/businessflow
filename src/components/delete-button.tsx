"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types/actions";

export function DeleteButton({
  label,
  description,
  action,
  redirectTo,
}: {
  label: string;
  description: string;
  action: () => Promise<ActionResult>;
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="outline" className="text-danger hover:bg-red-500/[0.06] hover:text-danger">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px]" />
        <AlertDialog.Content className="bg-surface-elevated fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[10px] border p-6 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          <AlertDialog.Title className="text-lg font-semibold">
            {label}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await action();
                  if (!result.success) toast.error(result.message);
                  else {
                    toast.success(result.message);
                    router.push(redirectTo);
                    router.refresh();
                  }
                })
              }
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
