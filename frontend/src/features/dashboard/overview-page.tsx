import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, PanelsTopLeft, Send, Video } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { Campaign, SubscriptionStatus, TestimonialListResult } from "@/lib/api/types";
import { testimonialsApi } from "@/features/testimonials/api";
import { campaignsApi } from "@/features/campaigns/api";
import { billingApi, isPaidPlan } from "@/features/billing/api";
import { TestimonialCard } from "@/features/testimonials/components/testimonial-card";
import { useAuth } from "@/features/auth/auth-provider";
import { UpgradeButton } from "@/features/billing/upgrade-button";

const StatCard = ({ label, used, limit, icon: Icon, to }: { label: string; used: number; limit: number; icon: typeof Video; to: string }) => {
  const unlimited = !Number.isFinite(limit);
  return (
    <Link to={to} className="block">
      <Card className="transition-shadow hover:shadow-lifted">
        <CardContent className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-5 w-5 text-brand-600" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-semibold tracking-tight text-gray-900">
              {used}
              <span className="text-base font-normal text-gray-400">/{unlimited ? "∞" : limit}</span>
            </p>
            <p className="truncate text-sm text-gray-500">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const OverviewPage = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [recent, setRecent] = useState<TestimonialListResult | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      billingApi.getSubscription(),
      testimonialsApi.list({ page: 1, limit: 3, sortBy: "created_at", sortOrder: "desc" }),
      campaignsApi.list(),
    ]).then(([sub, rec, camps]) => {
      if (sub.status === "fulfilled") setSubscription(sub.value);
      if (rec.status === "fulfilled") setRecent(rec.value);
      if (camps.status === "fulfilled") setCampaigns(camps.value);
      setLoading(false);
    });
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your testimonials."
        actions={
          <Link to="/requests">
            <Button>
              <Send className="h-4 w-4" />
              Request a testimonial
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : subscription ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Testimonials" used={subscription.usage.testimonials} limit={subscription.limits.testimonials} icon={Video} to="/testimonials" />
          <StatCard label="Campaigns" used={subscription.usage.campaigns} limit={subscription.limits.campaigns} icon={Megaphone} to="/campaigns" />
          <StatCard label="Embed sections" used={subscription.usage.embedSections} limit={subscription.limits.embedSections} icon={PanelsTopLeft} to="/embeds" />
        </div>
      ) : null}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent testimonials</h2>
          <Link to="/testimonials" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <GridSkeleton count={3} />
        ) : recent && recent.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.data.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Video}
            title="No testimonials yet"
            description="Create a request or a campaign and share the link with your clients."
            action={
              <div className="flex gap-3">
                <Link to="/requests"><Button>Create a request</Button></Link>
                <Link to="/campaigns"><Button variant="outline">Start a campaign</Button></Link>
              </div>
            }
          />
        )}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campaigns</CardTitle>
            <Link to="/campaigns" className="text-sm font-medium text-brand-600 hover:text-brand-700">Manage</Link>
          </CardHeader>
          <CardContent>
            {campaigns && campaigns.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {campaigns.slice(0, 4).map((campaign) => (
                  <li key={campaign.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{campaign.title}</p>
                      <p className="text-xs text-gray-500">
                        {campaign.submission_count} submissions · {campaign.view_count} views
                      </p>
                    </div>
                    <span className={`ml-3 shrink-0 text-xs font-medium ${campaign.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                      {campaign.is_active ? "Active" : "Paused"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-gray-500">
                No campaigns yet.{" "}
                <Link to="/campaigns" className="font-medium text-brand-600 hover:text-brand-700">Create one</Link>{" "}
                to collect testimonials at scale.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
          <CardContent className="py-8">
            <h3 className="text-lg font-semibold">
              {isPaidPlan(subscription?.plan ?? "free")
                ? "You're on a paid plan"
                : "Unlock unlimited testimonials"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-brand-100">
              {isPaidPlan(subscription?.plan ?? "free")
                ? "Enjoy unlimited testimonials, campaigns, and embed sections."
                : "Free includes 5 testimonials, 1 campaign, and 1 embed section. Upgrade for unlimited everything."}
            </p>
            {!isPaidPlan(subscription?.plan ?? "free") && (
              <UpgradeButton variant="secondary" className="mt-5 bg-white text-brand-700 hover:bg-brand-50" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
