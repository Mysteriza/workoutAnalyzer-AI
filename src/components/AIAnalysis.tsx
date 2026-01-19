import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { StravaActivity, ChartDataPoint } from "@/types";
import { analyzeActivity } from "@/utils/gemini";
import { getSavedAnalysis, saveAnalysis, deleteAnalysis } from "@/utils/storage";
import { Brain, Loader2, AlertCircle, Sparkles, Trash2, RefreshCw, Clock, Download } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface AIAnalysisProps {
  activity: StravaActivity;
  streamData: ChartDataPoint[];
}

export function AIAnalysis({ activity, streamData }: AIAnalysisProps) {
  const { userProfile } = useUserStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showReAnalyzeModal, setShowReAnalyzeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      } else {
        throw new Error("AI analysis result is empty.");
      }
    } catch (err: unknown) {
      const error = err as { message?: string; retryAfter?: number };
      if (error.message && error.message.includes("429")) {
        if (typeof error.retryAfter === 'number') {
          setCooldownSeconds(error.retryAfter);
          setError(`Cooldown active. Wait ${error.retryAfter} seconds.`);
        } else {
          setError(error.message || "Failed to analyze activity");
        }
      } else {
        setError(error.message || "Failed to analyze activity");
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
        second: '2-digit',
        hour12: false
      })
    : "";

  const formattedDate = analyzedAt
    ? new Date(analyzedAt).toLocaleDateString("en-US", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    : "";

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Performance Coach
            </CardTitle>
            {analyzedAt && analysis && (
               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                 <Clock className="h-3 w-3" />
                 <span>Analyzed: {formattedDate}, {formattedTime}</span>
               </div>
            )}
          </div>
          <div className="flex gap-2">
              {analysis && (
                <>
                  <Button variant="outline" size="icon" onClick={handleDownload} title="Export AI Analysis">
                      <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowReAnalyzeModal(true)}
                    title="Re-analyze"
                    disabled={cooldownSeconds > 0}
                  >
                    {cooldownSeconds > 0 ? (
                        <span className="text-xs font-bold text-orange-500">{cooldownSeconds}</span>
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowDeleteModal(true)} className="text-red-400 hover:text-red-500" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {!analysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-semibold text-lg">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground text-pretty">
                  AI will analyze heart rate, speed, and other stream data to provide performance insights.
                </p>
              </div>
              <Button onClick={() => handleAnalyze(false)} className="gradient-primary text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Analysis
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                 <p className="font-medium">Analyzing Activity...</p>
                 <p className="text-muted-foreground text-xs">AI is studying your workout data</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 text-center text-sm px-4">{error}</p>

              {cooldownSeconds > 0 ? (
                 <Button variant="outline" size="sm" disabled>
                    Wait {cooldownSeconds}s
                 </Button>
              ) : (
                 <Button variant="outline" size="sm" onClick={() => handleAnalyze(true)}>
                    Retry
                 </Button>
              )}
            </div>
          )}

          {analysis && !isLoading && (
            <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-base sm:text-lg font-bold text-foreground mt-6 mb-3 first:mt-0 pb-2 border-b border-border flex items-center gap-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm sm:text-base font-semibold text-foreground mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-muted-foreground mb-3 leading-relaxed text-sm text-justify">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-3 text-sm ml-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground mb-3 text-sm ml-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-muted-foreground text-justify pl-1">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-foreground font-semibold bg-primary/10 px-1 rounded">{children}</strong>
                    ),
                  }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={showReAnalyzeModal}
        onClose={() => setShowReAnalyzeModal(false)}
        onConfirm={() => handleAnalyze(true)}
        title="Re-analyze?"
        description="Re-analysis will use AI quota and overwrite the previous analysis. Are you sure?"
        confirmLabel="Yes, Re-analyze"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Analysis"
        description="Are you sure you want to permanently delete this analysis?"
        confirmLabel="Delete"
        isDestructive={true}
      />
    </>
  );
}
