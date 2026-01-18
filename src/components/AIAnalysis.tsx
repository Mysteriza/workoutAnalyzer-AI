"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { StravaActivity, ChartDataPoint } from "@/types";
import { analyzeActivity } from "@/utils/gemini";
import { getSavedAnalysis, saveAnalysis, deleteAnalysis } from "@/utils/storage";
import { Brain, Loader2, AlertCircle, Sparkles, Trash2, RefreshCw, Clock, Download } from "lucide-react";

interface AIAnalysisProps {
  activity: StravaActivity;
  streamData: ChartDataPoint[];
}

export function AIAnalysis({ activity, streamData }: AIAnalysisProps) {
  const { profile } = useUserStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedAnalysis(activity.id);
    if (saved) {
      setAnalysis(saved.content);
      setAnalyzedAt(saved.analyzedAt);
    }
  }, [activity.id]);

  const handleAnalyze = async () => {
    if (!profile) {
      setError("Lengkapi profil Anda di Settings terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sampleSize = Math.min(streamData.length, 200);
      const step = Math.max(1, Math.floor(streamData.length / sampleSize));
      const streamSample = streamData.filter((_, index) => index % step === 0);

      const result = await analyzeActivity({
        activity,
        streamSample,
        userProfile: profile,
      });

      setAnalysis(result);
      setAnalyzedAt(new Date().toISOString());
      saveAnalysis(activity.id, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menganalisis aktivitas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    deleteAnalysis(activity.id);
    setAnalysis(null);
    setAnalyzedAt(null);
  };

  const handleExport = () => {
    if (!analysis) return;
    
    const exportContent = `# Analisis AI - ${activity.name}
Tanggal Aktivitas: ${new Date(activity.start_date_local).toLocaleString("id-ID")}
Dianalisis pada: ${analyzedAt ? new Date(analyzedAt).toLocaleString("id-ID") : "-"}

---

${analysis}
`;
    
    const blob = new Blob([exportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const safeName = activity.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `analisis_${safeName}_${activity.id}.md`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Physiological Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !isLoading && !error && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Dapatkan Insight AI</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Analisis latihan dengan AI untuk insight fisiologis, zona jantung, dan rekomendasi personal.
              </p>
            </div>
            <Button
              onClick={handleAnalyze}
              className="gradient-primary text-white"
              disabled={!profile}
            >
              <Brain className="h-4 w-4 mr-2" />
              Analisis Aktivitas
            </Button>
            {!profile && (
              <p className="text-sm text-yellow-400">
                Lengkapi profil di Settings untuk mengaktifkan analisis.
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Menganalisis aktivitas...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-400 text-center text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={handleAnalyze}>
              Coba Lagi
            </Button>
          </div>
        )}

        {analysis && (
          <div className="space-y-3">
            {analyzedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Dianalisis pada {formatDate(analyzedAt)}
              </div>
            )}
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-sm sm:text-base font-semibold text-foreground mt-4 mb-2 first:mt-0 pb-1 border-b border-border">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-medium text-foreground mt-3 mb-1">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground mb-2 leading-relaxed text-xs sm:text-sm">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground mb-2 text-xs sm:text-sm">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground mb-2 text-xs sm:text-sm">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-muted-foreground text-xs sm:text-sm">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">{children}</strong>
                  ),
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
            <div className="pt-3 border-t border-border flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleAnalyze}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Analisis Ulang
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
