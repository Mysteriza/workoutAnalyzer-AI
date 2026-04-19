"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import dynamic from "next/dynamic";
const ActivityList = dynamic(() => import("@/components/ActivityList").then(mod => mod.ActivityList), { ssr: false, loading: () => <div className="animate-pulse flex flex-col gap-4"><div className="h-32 bg-muted/50 rounded-xl"/><div className="h-32 bg-muted/50 rounded-xl"/></div> });
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Zap, Activity, TrendingUp, Brain } from "lucide-react";

export default function HomePage() {
  const { isConnected, userProfile, isLoading, initializeFromStorage } = useUserStore();

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isConnected || !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16 animate-in-fade">
        <div className="max-w-3xl mx-auto text-center space-y-10 sm:space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center p-4 sm:p-5 rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="text-foreground">CardioKernel</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto px-4 font-medium leading-relaxed">
              Analyze your Strava workouts with AI-powered physiological insights.
              Get heart rate zone analysis and personalized recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="surface p-6 sm:p-8 flex flex-col items-center text-center">
              <Activity className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-base">Strava Integration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your Strava account to automatically sync your activities.
              </p>
            </Card>
            <Card className="surface p-6 sm:p-8 flex flex-col items-center text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-base">Interactive Charts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize precise heart rate, pace, and power data dynamically.
              </p>
            </Card>
            <Card className="surface p-6 sm:p-8 flex flex-col items-center text-center">
              <Brain className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-base">AI Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive physiological insights powered by advanced AI models.
              </p>
            </Card>
          </div>

          <div className="space-y-6 px-4 pt-4">
            <p className="text-muted-foreground font-medium">
              {!userProfile
                ? "Complete your profile first to get started"
                : "Connect your Strava account to view your activities"}
            </p>
            <Link href="/settings">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-md transition-transform hover:scale-[1.02] active:scale-95">
                <Settings className="h-5 w-5 mr-2" />
                Open Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Activities</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Recent workouts from your Strava account. Click an activity to view details and AI analysis.
        </p>
      </div>
      <ActivityList />
    </div>
  );
}
