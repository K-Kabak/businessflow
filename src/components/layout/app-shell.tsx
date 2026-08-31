"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
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
  { label: "Workspace", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Delivery",
    items: [
      { href: "/clients", label: "Clients", icon: Building2 },
      { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
      { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
      { href: "/board", label: "Board", icon: KanbanSquare },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/settings/profile", label: "Settings", icon: Settings },
    ],
  },
] as const;

type ShellUser = { name: string; email: string; role: "ADMIN" | "EMPLOYEE" };

function Brand() {
  return (
    <Link href="/dashboard" className="flex h-14 items-center gap-2.5 border-b px-4 font-semibold tracking-[-0.02em]">
      <span className="bg-foreground text-background grid size-7 place-items-center rounded-md text-[10px] font-bold tracking-tight">BF</span>
      <span>BusinessFlow</span>
    </Link>
  );
}

function AccountMenu({ user, compact = false }: { user: ShellUser; compact?: boolean }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn("hover:bg-muted flex items-center rounded-md text-left transition-colors", compact ? "size-10 justify-center" : "w-full gap-3 p-2")}
          aria-label="Open account menu"
        >
          <Avatar name={user.name} />
          {!compact ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{user.name}</span>
                <span className="text-muted-foreground block truncate text-[11px]">{user.email}</span>
              </span>
              <ChevronDown className="text-muted-foreground size-3.5" />
            </>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="bg-surface-elevated z-[70] min-w-56 rounded-lg border p-1.5 shadow-[0_14px_40px_rgba(0,0,0,.16)]">
          <div className="border-b px-2.5 py-2">
            <p className="text-[13px] font-medium">{user.name}</p>
            <div className="mt-1"><Badge value={user.role} /></div>
          </div>
          <DropdownMenu.Item asChild>
            <Link href="/settings/profile" className="hover:bg-muted focus:bg-muted mt-1 flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[13px] outline-none">
              <UserRound className="size-4" /> Profile settings
            </Link>
          </DropdownMenu.Item>
          <form action={logoutAction}>
            <DropdownMenu.Item asChild>
              <button className="text-danger hover:bg-muted focus:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[13px] outline-none">
                <LogOut className="size-4" /> Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Sidebar({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="bg-card flex h-full flex-col">
      <Brand />
      <nav className="flex-1 overflow-y-auto px-2.5 py-4" aria-label="Main navigation">
        {navigation.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="text-muted-foreground mb-1.5 px-2 text-[10px] font-semibold tracking-[0.08em] uppercase">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "text-muted-foreground hover:bg-muted hover:text-foreground relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                      active && "bg-primary-soft text-foreground before:bg-primary before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-full",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.7} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t p-2.5"><AccountMenu user={user} /></div>
    </div>
  );
}

function sectionTitle(pathname: string) {
  for (const group of navigation) {
    const item = group.items.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
    if (item) return item.label;
  }
  return "BusinessFlow";
}

function contentWidth(pathname: string) {
  if (pathname.startsWith("/board")) return "max-w-none";
  if (pathname.includes("/new") || pathname.includes("/edit")) return "max-w-5xl";
  if (pathname.startsWith("/settings")) return "max-w-6xl";
  return "max-w-[1440px]";
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = sectionTitle(pathname);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r lg:block"><Sidebar user={user} /></aside>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Trigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-1.5 left-2 z-30 lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <Dialog.Content className="bg-card fixed inset-y-0 left-0 z-50 w-[min(88vw,300px)] border-r shadow-2xl focus:outline-none">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="absolute top-1.5 right-2 z-10" aria-label="Close navigation"><X className="size-5" /></Button>
            </Dialog.Close>
            <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="min-w-0 lg:col-start-2">
        <header className="bg-background/92 sticky top-0 z-20 flex h-14 items-center border-b px-4 pl-16 backdrop-blur-md sm:px-6 sm:pl-16 lg:px-8">
          <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs">
            <span className="hidden sm:inline">Workspace</span>
            <ChevronRight className="hidden size-3 sm:inline" />
            <span className="text-foreground truncate font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1"><ThemeToggle /><div className="hidden sm:block"><AccountMenu user={user} compact /></div></div>
        </header>
        <main className={cn("mx-auto p-4 sm:p-6 lg:p-8", contentWidth(pathname))}>{children}</main>
      </div>
    </div>
  );
}
