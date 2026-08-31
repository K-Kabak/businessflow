import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SettingsNav({ admin }: { admin: boolean }) {
  return (
    <nav className="flex gap-2" aria-label="Settings">
      <Button asChild variant="outline" size="sm">
        <Link href="/settings/profile">Profile</Link>
      </Button>
      {admin ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/organization">Organization</Link>
        </Button>
      ) : null}
    </nav>
  );
}
