"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function LoginScreen() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("strava", { callbackUrl: "/settings" });
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="text-center py-8">
        <p className="mb-4 text-muted-foreground">You are connected as {session.user?.name}</p>
        <Button onClick={() => signOut()}>Logout</Button>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8 glass">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>
          Connect your Strava account to start advanced performance analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-500 text-sm text-center">
          Deep AI analysis, cross-device sync, and automatic backup.
        </div>

        <Button
          className="w-full bg-[#fc4c02] hover:bg-[#e34402] text-white"
          size="lg"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          )}
          Connect with Strava
        </Button>
      </CardContent>
    </Card>
  );
}
