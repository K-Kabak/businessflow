"use client";

import { Building2, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/settings/profile", label: "Profile", icon: UserRound },
    ...(admin ? [{ href: "/settings/organization", label: "Organization", icon: Building2 }] : []),
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-2 md:flex-col md:border-r md:border-b-0 md:pr-4 md:pb-0" aria-label="Settings">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cn("text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium", pathname === href && "bg-primary-soft text-foreground")}>
          <Icon className="size-4" />{label}
        </Link>
      ))}
    </nav>
  );
}
