"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Activity, LayoutDashboard } from "lucide-react";
import { UserDropdown } from "@/components/UserDropdown";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            CardioKernel
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline-block">Dashboard</span>
            </Button>
          </Link>
          {session ? (
            <UserDropdown
              userName={session.user?.name}
              userImage={session.user?.image}
            />
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
