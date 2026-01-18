"use client";

import Link from "next/link";
import { Activity, Settings, Zap } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useEffect } from "react";

export function Header() {
  const { isConnected, initializeFromStorage, isLoading } = useUserStore();

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 sm:p-2 rounded-lg gradient-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="text-base sm:text-xl font-bold gradient-text hidden xs:inline">
            AI Workout Analyzer
          </span>
          <span className="text-base font-bold gradient-text xs:hidden">
            Workout AI
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {!isLoading && isConnected && (
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activities</span>
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
