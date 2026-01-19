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
import { Brain, Loader2, AlertCircle, Sparkles, Trash2, RefreshCw, Clock, Download, Zap } from "lucide-react";
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

export function AIAnalysis({ activity, streamData }: AIAnalysisProps) {
  const { userProfile } = useUserStore();
  const { getUsage, incrementUsage, loadFromCloud } = useUsageStore();
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
    const saved = getSavedAnalysis(activity.id);
    if (saved && saved.content && saved.content.trim().length > 0) {
      setAnalysis(saved.content);
      setAnalyzedAt(saved.analyzedAt);
    }
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
    if (isReAnalyze) setAnalysis(null);

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
      const error = err as { message?: string; retryAfter?: number };
      if (error.message && error.message.includes("rate limit")) {
        setCooldownSeconds(60);
      }
      setError(error.message || "Failed to analyze activity");
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

  const handleDownload = () => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${activity.name.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRemainingQuota = () => {
    if (!modelInfo) return 0;
    const used = getUsage();
    return Math.max(0, modelInfo.limits.rpd - used);
  };

  const isQuotaExhausted = getRemainingQuota() <= 0;

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
                  <Button variant="outline" size="icon" onClick={handleDownload} title="Export" className="h-8 w-8">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
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
              <Button size="sm" onClick={() => handleAnalyze(analysis ? true : false)} disabled={cooldownSeconds > 0}>
                {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : "Retry"}
              </Button>
            </div>
          ) : analysis ? (
            <article className="prose prose-sm prose-invert max-w-none dark:prose-invert prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-bold prose-p:my-3 prose-ul:my-2 prose-li:my-1 prose-strong:text-foreground">
              <ReactMarkdown>{analysis}</ReactMarkdown>
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
                    Quota resets at midnight Pacific Time (~3 PM WIB).
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

      <ConfirmationModal
        isOpen={showReAnalyzeModal}
        onClose={() => setShowReAnalyzeModal(false)}
        onConfirm={() => handleAnalyze(true)}
        title="Re-analyze with AI?"
        description={`This will regenerate the analysis using ${modelInfo?.name || "AI"}. The previous analysis will be replaced.`}
        confirmLabel="Re-analyze"
      />

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
