import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, PanelsTopLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { EmbedSection } from "@/lib/api/types";
import { embedsApi } from "../api";

const layoutLabels: Record<string, string> = {
  grid: "Grid",
  carousel: "Carousel",
  list: "List",
};

export const EmbedsPage = () => {
  const [embeds, setEmbeds] = useState<EmbedSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    embedsApi
      .list()
      .then(setEmbeds)
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load embeds";
        setError(message);
        if (err instanceof ApiError && err.status !== 401) toast.error(message);
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Embeds"
        description="Showcase your testimonials on any website with a two-line snippet."
        actions={
          <Link to="/embeds/new">
            <Button>
              <Plus className="h-4 w-4" />
              New embed
            </Button>
          </Link>
        }
      />

      {!embeds && !error ? (
        <RowsSkeleton count={2} />
      ) : error ? (
        <EmptyState icon={PanelsTopLeft} title="Couldn't load embeds" description={error} />
      ) : embeds!.length === 0 ? (
        <EmptyState
          icon={PanelsTopLeft}
          title="No embeds yet"
          description="Pick your best testimonials and embed them on your site in minutes."
          action={
            <Link to="/embeds/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create your first embed
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {embeds!.map((embed) => (
            <div
              key={embed.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/embeds/${embed.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/embeds/${embed.id}`);
                }
              }}
              className="block h-full cursor-pointer"
            >
              <Card className="h-full transition-shadow hover:shadow-lifted">
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-gray-900">{embed.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">/{embed.public_id}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge tone="brand">{layoutLabels[embed.layout] ?? embed.layout}</Badge>
                      <Badge tone={embed.is_active ? "green" : "gray"}>
                        {embed.is_active ? "Live" : "Off"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {embed.testimonials.slice(0, 5).map(({ testimonial }) => (
                      <span
                        key={testimonial.id}
                        className="relative flex h-9 w-14 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-brand-500 to-indigo-500 text-[10px] font-semibold text-white"
                      >
                        {testimonial.thumbnail_url ? (
                          <img
                            src={testimonial.thumbnail_url}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          testimonial.client_name.split(" ").map((p) => p[0]).join("").slice(0, 2)
                        )}
                      </span>
                    ))}
                    {embed.testimonials.length > 5 && (
                      <span className="text-xs text-gray-400">+{embed.testimonials.length - 5}</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {embed.view_count} views · {embed.testimonials.length} testimonials ·{" "}
                        {formatDate(embed.created_at)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/embeds/${embed.id}`);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
