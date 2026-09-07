import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Megaphone, Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { Campaign } from "@/lib/api/types";
import { campaignsApi } from "../api";

export const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    campaignsApi
      .list()
      .then(setCampaigns)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load campaigns"));
  }, []);

  const toggleActive = async (campaign: Campaign) => {
    setTogglingId(campaign.id);
    try {
      const updated = await campaignsApi.update(campaign.id, { isActive: !campaign.is_active });
      setCampaigns((prev) => prev?.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)) ?? null);
      toast.success(updated.is_active ? "Campaign activated" : "Campaign paused");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update campaign");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Collect testimonials at scale with a single public link."
        actions={
          <Link to="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4" />
              New campaign
            </Button>
          </Link>
        }
      />

      {!campaigns && !error ? (
        <RowsSkeleton count={3} />
      ) : error ? (
        <EmptyState icon={Megaphone} title="Couldn't load campaigns" description={error} />
      ) : campaigns!.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create a campaign and share one link with all your clients."
          action={
            <Link to="/campaigns/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create your first campaign
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {campaigns!.map((campaign) => (
            <Card key={campaign.id} className="transition-shadow hover:shadow-lifted">
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/campaigns/${campaign.id}`} className="block truncate text-base font-semibold text-gray-900 hover:text-brand-700">
                      {campaign.title}
                    </Link>
                    {campaign.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{campaign.description}</p>
                    )}
                  </div>
                  <Badge tone={campaign.is_active ? "green" : "gray"}>
                    {campaign.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-5 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="h-4 w-4" />
                    {campaign.submission_count} submissions
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {campaign.view_count} views
                  </span>
                  <span className="ml-auto text-xs">Created {formatDate(campaign.created_at)}</span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <CopyButton value={campaign.url} label="Copy link" />
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    {campaign.is_active ? "On" : "Off"}
                    <Switch
                      checked={campaign.is_active}
                      disabled={togglingId === campaign.id}
                      onCheckedChange={() => toggleActive(campaign)}
                      aria-label={`Toggle ${campaign.title}`}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
