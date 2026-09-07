import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Sparkles, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import type { SearchResult, SearchResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-3/4" />
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const sentiment = getSentimentBadge(result.sentiment);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-shadow hover:shadow-lifted">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate font-semibold text-gray-900">{result.clientName}</h3>
        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSimilarityColor(result.similarity)}`}>
          {(result.similarity * 100).toFixed(1)}%
        </span>
      </div>

      {result.summary && (
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">{result.summary}</p>
      )}

      {result.transcript && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{result.transcript}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={sentiment.tone}>{sentiment.label}</Badge>
        {result.industry && (
          <span className="text-xs text-gray-500">{result.industry}</span>
        )}
      </div>

      {result.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.keywords.map((kw) => (
            <span key={kw} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {kw}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">{formatDate(result.createdAt)}</p>
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 3 }, (_, i) => (
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {results.results.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
