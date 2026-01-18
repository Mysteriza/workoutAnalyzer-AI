import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Settings, User } from "lucide-react";
import { auth } from "@/lib/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Workout Analyzer AI
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              <span className="sm:hidden">
                <Activity className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline-block">Dashboard</span>
            </Link>
            <Link href="/settings" className="text-sm font-medium transition-colors hover:text-primary">
              <span className="sm:hidden">
                <Settings className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline-block">Settings</span>
            </Link>
            {session ? (
              <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground hidden sm:inline-block truncate max-w-[100px]">
                   {session.user?.name}
                 </span>
                 {session.user?.image && (
                   <img src={session.user.image} alt="User" className="h-6 w-6 rounded-full" />
                 )}
              </div>
            ) : (
               <Link href="/login">
                 <Button variant="ghost" size="sm">
                   Login
                 </Button>
               </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
