"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { useUsageStore } from "@/store/usageStore";
import { StravaActivity, ChartDataPoint } from "@/types";
import { analyzeActivity } from "@/utils/gemini";
import { getSavedAnalysis, saveAnalysis, deleteAnalysis } from "@/utils/storage";
import { Brain, Loader2, AlertCircle, Sparkles, Trash2, RefreshCw, Clock, Zap } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface ModelInfo {
  id: string;
  name: string;
  limits: {
    rpm: number;
    tpm: number;
    rpd: number;
  };
}

interface AIAnalysisProps {
  activity: StravaActivity;
  streamData: ChartDataPoint[];
}

function getTimeUntilPacificMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const midnight = new Date(pacificTime);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  
  const diff = midnight.getTime() - pacificTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
}

export function AIAnalysis({ activity, streamData }: AIAnalysisProps) {
  const { userProfile } = useUserStore();
  const { count, lastReset, incrementUsage, loadFromCloud } = useUsageStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showReAnalyzeModal, setShowReAnalyzeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    loadFromCloud();
    fetch("/api/model")
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(() => {});
  }, [loadFromCloud]);

  useEffect(() => {
    const loadAnalysis = async () => {
      const saved = getSavedAnalysis(activity.id);
      if (saved && saved.content && saved.content.trim().length > 0) {
        setAnalysis(saved.content);
        setAnalyzedAt(saved.analyzedAt);
      } else {
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              prompt: "", 
              activityId: activity.id, 
              forceRefresh: false 
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.isCached && data.content) {
              setAnalysis(data.content);
              setAnalyzedAt(data.updatedAt);
              saveAnalysis(activity.id, data.content);
            }
          }
        } catch {}
      }
    };
    loadAnalysis();
  }, [activity.id]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const startCooldown = useCallback(() => {
    setCooldownSeconds(60);
  }, []);

  const handleAnalyze = async (isReAnalyze = false) => {
    if (!userProfile) return;
    if (cooldownSeconds > 0 && isReAnalyze) return;

    setIsLoading(true);
    setError(null);

    try {
      const sampleSize = Math.min(streamData.length, 200);
      const step = Math.max(1, Math.floor(streamData.length / sampleSize));
      const streamSample = streamData.filter((_: ChartDataPoint, index: number) => index % step === 0);

      const result = await analyzeActivity({
        activity,
        streamSample,
        userProfile: userProfile,
        forceRefresh: isReAnalyze
      });

      if (result && result.trim().length > 0) {
        setAnalysis(result);
        const now = new Date().toISOString();
        setAnalyzedAt(now);
        saveAnalysis(activity.id, result);
        incrementUsage();
        startCooldown();
      } else {
        throw new Error("AI analysis result is empty.");
      }
    } catch (err: unknown) {
      const error = err as { message?: string; retryAfter?: number; cachedContent?: string };
      
      if (error.cachedContent) {
        setAnalysis(error.cachedContent);
        setError(null);
      } else {
        setError(error.message || "Failed to analyze activity");
      }
      
      if (error.retryAfter) {
        setCooldownSeconds(error.retryAfter);
      }
    } finally {
      setIsLoading(false);
      setShowReAnalyzeModal(false);
    }
  };

  const handleDelete = () => {
    deleteAnalysis(activity.id);
    setAnalysis(null);
    setAnalyzedAt(null);
    setShowDeleteModal(false);
  };



  const getRemainingQuota = () => {
    if (!modelInfo) return 0;
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const todayPacific = pacificTime.toISOString().split("T")[0];
    const used = todayPacific === lastReset ? count : 0;
    return Math.max(0, modelInfo.limits.rpd - used);
  };

  const isQuotaExhausted = getRemainingQuota() <= 0;
  const resetTime = getTimeUntilPacificMidnight();

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-orange-500 bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Complete your physiological profile in Settings to use AI Analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedTime = analyzedAt
    ? new Date(analyzedAt).toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : "";

  const formattedDate = analyzedAt
    ? new Date(analyzedAt).toLocaleDateString("en-US", {
        day: 'numeric',
        month: 'short'
    })
    : "";

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                AI Performance Coach
              </CardTitle>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                {modelInfo && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                    <Zap className="h-3 w-3" />
                    {modelInfo.name}
                  </span>
                )}
                {modelInfo && (
                  <span className={`px-1.5 py-0.5 rounded ${isQuotaExhausted ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                    {getRemainingQuota()}/{modelInfo.limits.rpd} RPD
                  </span>
                )}
                {analyzedAt && analysis && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formattedDate}, {formattedTime}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {analysis && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowReAnalyzeModal(true)}
                    title="Re-analyze"
                    disabled={cooldownSeconds > 0}
                    className="h-8 w-8"
                  >
                    {cooldownSeconds > 0 ? (
                      <span className="text-[10px] font-bold text-orange-500">{cooldownSeconds}</span>
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowDeleteModal(true)} className="text-red-400 hover:text-red-500 h-8 w-8" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        {cooldownSeconds > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex-1 h-1.5 bg-orange-500/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(cooldownSeconds / 60) * 100}%` }}
                />
              </div>
              <span className="text-xs text-orange-500 font-medium min-w-[50px] text-right">
                {cooldownSeconds}s left
              </span>
            </div>
          </div>
        )}
        
        <CardContent className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing with {modelInfo?.name || "AI"}...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 text-center text-sm px-4">{error}</p>
              <Button size="sm" onClick={() => handleAnalyze(analysis ? true : false)} disabled={cooldownSeconds > 0 || isQuotaExhausted}>
                {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : isQuotaExhausted ? "Quota Exhausted" : "Retry"}
              </Button>
            </div>
          ) : analysis ? (
            <article className="prose prose-sm prose-invert max-w-none dark:prose-invert [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-border [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-semibold [&_p]:my-4 [&_p]:text-justify [&_p]:leading-relaxed [&_ul]:my-4 [&_li]:my-2 [&_li]:text-justify [&_table]:my-4 [&_td]:text-justify [&_strong]:font-bold [&_strong]:text-foreground">
              <ReactMarkdown>{analysis.replace(/([^\n])\n(##)/g, '$1\n\n$2').replace(/([^\n])\n(###)/g, '$1\n\n$2').replace(/([^\n])\n(\*\*)/g, '$1\n\n$2')}</ReactMarkdown>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className={`p-3 rounded-full ${isQuotaExhausted ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                <Brain className={`h-6 w-6 ${isQuotaExhausted ? 'text-red-500' : 'text-primary'}`} />
              </div>
              {isQuotaExhausted ? (
                <>
                  <p className="text-sm text-red-500 font-medium">Daily Quota Exhausted</p>
                  <p className="text-[10px] text-muted-foreground text-center px-4">
                    You have used all {modelInfo?.limits.rpd} requests for today. 
                    Resets in {resetTime.hours}h {resetTime.minutes}m (midnight Pacific).
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Ready to Analyze</p>
                  {modelInfo && (
                    <p className="text-[10px] text-muted-foreground">
                      {modelInfo.name} · {getRemainingQuota()} requests left today
                    </p>
                  )}
                  <Button size="sm" onClick={() => handleAnalyze()} className="gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Analysis
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showReAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-lg border bg-white dark:bg-zinc-900 p-6 shadow-lg">
            {isQuotaExhausted ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-red-500/10">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold text-red-500">Daily Quota Exhausted</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have used all {modelInfo?.limits.rpd} AI analysis requests for today. 
                  The quota will reset at midnight Pacific Time.
                </p>
                <div className="p-3 bg-muted rounded-lg mb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Time until reset</p>
                  <p className="text-2xl font-bold text-primary">
                    {resetTime.hours}h {resetTime.minutes}m
                  </p>
                  <p className="text-[10px] text-muted-foreground">~3 PM WIB</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setShowReAnalyzeModal(false)}>
                    OK
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-2">Re-analyze with AI?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This will regenerate the analysis using {modelInfo?.name || "AI"}. The previous analysis will be replaced.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowReAnalyzeModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setShowReAnalyzeModal(false);
                    handleAnalyze(true);
                  }}>
                    Re-analyze
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete AI Analysis?"
        description="This will permanently delete the AI analysis for this activity."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </>
  );
}
