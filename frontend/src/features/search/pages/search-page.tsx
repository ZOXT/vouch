import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Sparkles, AlertCircle, Play } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import type { SearchResult, SearchResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn, initialsOf } from "@/lib/utils";

const SIMILARITY_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800",
  mid: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-600",
};

function getSimilarityColor(sim: number): string {
  if (sim >= 0.8) return SIMILARITY_COLORS.high;
  if (sim >= 0.6) return SIMILARITY_COLORS.mid;
  return SIMILARITY_COLORS.low;
}

function getSentimentBadge(sentiment: string): { tone: "green" | "gray" | "red"; label: string } {
  const lower = sentiment.toLowerCase();
  if (lower === "positive") return { tone: "green", label: "Positive" };
  if (lower === "negative") return { tone: "red", label: "Negative" };
  return { tone: "gray", label: sentiment || "Neutral" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-full" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

function ResultCard({ result, onPlay }: { result: SearchResult; onPlay: () => void }) {
  const sentiment = getSentimentBadge(result.sentiment);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPlay();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500">
        {result.thumbnailUrl ? (
          <img
            src={result.thumbnailUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white/25">
            {initialsOf(result.clientName)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {result.videoUrl && (
          <>
            <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
            <span
              className="absolute right-2 top-2"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <CopyButton
                iconOnly
                value={result.videoUrl}
                label="Share video"
                copiedLabel="Link copied"
                className="border-transparent bg-white/90 text-gray-600 shadow-sm hover:bg-white"
              />
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-gray-900">{result.clientName}</h3>
        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSimilarityColor(result.similarity)}`}>
          {(result.similarity * 100).toFixed(1)}%
        </span>
      </div>

      {result.summary && (
        <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-2">{result.summary}</p>
      )}

      {result.transcript && (
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">{result.transcript}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={sentiment.tone}>{sentiment.label}</Badge>
        {result.industry && (
          <span className="text-xs text-gray-500">{result.industry}</span>
        )}
      </div>

      {result.keywords.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {result.keywords.map((kw) => (
            <span key={kw} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">{formatDate(result.createdAt)}</p>
        <span className={cn("text-xs font-medium", result.videoUrl ? "text-brand-600" : "text-gray-300")}>
            {result.videoUrl ? "Watch video" : "No video"}
        </span>
      </div>
    </div>
  );
}

export const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string, ind: string, t: number) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await apiFetch<SearchResponse>("/search", {
        method: "POST",
        body: {
          query: trimmed,
          threshold: t,
          industry: ind.trim() || undefined,
        },
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") doSearch(query, industry, threshold);
  };

  const handleSubmit = () => doSearch(query, industry, threshold);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Search testimonials</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find the right testimonial by meaning, not just keywords.
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are you looking for?"
            className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-28 text-lg shadow-sm transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Industry filter… (e.g. Healthcare, SaaS)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm shadow-sm transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
            {industry && (
              <button
                type="button"
                onClick={() => setIndustry("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 p-1 text-gray-500 hover:bg-gray-200"
                aria-label="Clear industry filter"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 px-1">
          <label htmlFor="threshold" className="text-xs text-gray-500">
            Similarity threshold:
          </label>
          <input
            id="threshold"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
          />
          <span className="min-w-[2.5rem] text-right text-xs font-medium tabular-nums text-gray-700">
            {threshold.toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-2xl rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
            <Sparkles className="h-10 w-10 text-brand-500" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-gray-900">Search your testimonials</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Type a topic and Vouch finds the most relevant testimonials, even when they don&apos;t match your exact words.
          </p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && hasSearched && results && results.results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900">No results found</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            No testimonials matched &ldquo;{results.query}&rdquo;. Try rephrasing your search or using different keywords.
          </p>
        </div>
      )}

      {!loading && hasSearched && results && results.results.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-900">{results.total}</span> result{results.total !== 1 && "s"} for &ldquo;{results.query}&rdquo;
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.results.map((r) => (
              <ResultCard key={r.id} result={r} onPlay={() => r.videoUrl && setActiveResult(r)} />
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={activeResult !== null}
        onOpenChange={(open) => {
          if (!open) setActiveResult(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          {activeResult?.videoUrl && (
            <div>
              <DialogTitle>{activeResult.clientName}</DialogTitle>
              <DialogDescription className="sr-only">
                Video testimonial from {activeResult.clientName}
              </DialogDescription>
              <video
                key={activeResult.id}
                src={activeResult.videoUrl}
                controls
                autoPlay
                playsInline
                className="mt-4 aspect-video w-full rounded-lg bg-black"
                poster={activeResult.thumbnailUrl ?? undefined}
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {activeResult.summary && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{activeResult.summary}</p>
                  )}
                </div>
                <CopyButton value={activeResult.videoUrl} label="Share" copiedLabel="Link copied" size="sm" className="shrink-0" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
