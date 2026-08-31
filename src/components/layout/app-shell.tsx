"use client";

import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { logoutAction } from "@/features/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

type ShellUser = { name: string; email: string; role: "ADMIN" | "EMPLOYEE" };

function Sidebar({
  user,
  onNavigate,
}: {
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="bg-card flex h-full flex-col">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-16 items-center gap-2 border-b px-5 font-semibold tracking-tight"
      >
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <BriefcaseBusiness className="size-4" />
        </span>
        BusinessFlow
      </Link>
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active && "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <Badge value={user.role} className="mt-1 py-0.5" />
          </div>
        </div>
        <form action={logoutAction} className="mt-1">
          <Button
            variant="ghost"
            className="text-muted-foreground w-full justify-start"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function sectionTitle(pathname: string) {
  const item = navigation.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return item?.label ?? "BusinessFlow";
}

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        <Sidebar user={user} />
      </aside>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-2 z-10"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </Button>
        <Sidebar user={user} onNavigate={() => setOpen(false)} />
      </aside>
      <div className="lg:col-start-2">
        <header className="bg-background/90 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <p className="flex-1 font-medium">{sectionTitle(pathname)}</p>
          <ThemeToggle />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
