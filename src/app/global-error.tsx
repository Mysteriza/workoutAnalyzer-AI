"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-500/10">
                <AlertOctagon className="h-8 w-8 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Critical Error</h2>
                <p className="text-sm text-muted-foreground">
                  The application encountered a critical error and cannot continue. 
                  This is likely a temporary issue.
                </p>
              </div>

              {error.digest && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
              )}

              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
