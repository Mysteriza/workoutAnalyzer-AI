"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { ActivityList } from "@/components/ActivityList";
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
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl gradient-primary shadow-lg shadow-primary/25">
              <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="gradient-text">CardioKernel</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto px-4">
              Analyze your Strava workouts with AI-powered physiological insights.
              Get heart rate zone analysis and personalized recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <Card className="glass text-center p-4 sm:p-6">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Strava Integration</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Connect your Strava account to import activities
              </p>
            </Card>
            <Card className="glass text-center p-4 sm:p-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Interactive Charts</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visualize heart rate and speed data
              </p>
            </Card>
            <Card className="glass text-center p-4 sm:p-6">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 text-sm sm:text-base">AI Analysis</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Physiological insights from Google Gemini
              </p>
            </Card>
          </div>

          <div className="space-y-4 px-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              {!userProfile
                ? "Complete your profile first to get started"
                : "Connect your Strava account to view your activities"}
            </p>
            <Link href="/settings">
              <Button size="lg" className="gradient-primary text-white w-full sm:w-auto">
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
