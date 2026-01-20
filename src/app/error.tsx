"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
    }
  }, [error]);

  const getErrorMessage = () => {
    const msg = error.message?.toLowerCase() || "";
    
    if (msg.includes("strava") || msg.includes("401") || msg.includes("unauthorized")) {
      return {
        title: "Strava Connection Issue",
        description: "Strava seems tired right now. Your session may have expired or Strava services are temporarily unavailable.",
        action: "reconnect"
      };
    }
    
    if (msg.includes("gemini") || msg.includes("ai") || msg.includes("analysis")) {
      return {
        title: "AI Analysis Error",
        description: "The AI coach is taking a break. This might be due to rate limits or service availability.",
        action: "retry"
      };
    }
    
    if (msg.includes("network") || msg.includes("fetch")) {
      return {
        title: "Network Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        action: "retry"
      };
    }
    
    return {
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Our team has been notified.",
      action: "retry"
    };
  };

  const { title, description, action } = getErrorMessage();

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full glass">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-orange-500/10">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {error.digest && (
            <p className="text-[10px] text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={reset} className="flex-1 gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            {action === "reconnect" ? (
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Reconnect
                </Button>
              </Link>
            ) : (
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
