import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/api/types";
import { billingApi, isPaidPlan } from "./api";
import { UpgradeButton } from "./upgrade-button";

const UsageBar = ({ label, used, limit }: { label: string; used: number; limit: number }) => {
  const unlimited = !Number.isFinite(limit);
  const fraction = unlimited ? 0 : Math.min(1, used / limit);
  const nearLimit = !unlimited && fraction >= 0.8;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={cn("font-medium", nearLimit ? "text-amber-600" : "text-gray-500")}>
          {used}/{unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all", nearLimit ? "bg-amber-500" : "bg-brand-500")}
          style={{ width: unlimited ? "100%" : `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
};

export const UpgradeCard = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    billingApi.getSubscription().then(setSubscription).catch(() => {});
  }, []);

  if (!subscription) return null;
  if (isPaidPlan(subscription.plan)) {
    return (
      <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Sparkles className="h-4 w-4" />
          Paid plan active
        </div>
        <p className="mt-1 text-xs text-brand-700/80">Unlimited testimonials, campaigns, and embeds.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
      <p className="text-sm font-semibold text-gray-900">Free plan</p>
      <div className="mt-3 space-y-2.5">
        <UsageBar label="Testimonials" used={subscription.usage.testimonials} limit={subscription.limits.testimonials} />
        <UsageBar label="Campaigns" used={subscription.usage.campaigns} limit={subscription.limits.campaigns} />
        <UsageBar label="Embeds" used={subscription.usage.embedSections} limit={subscription.limits.embedSections} />
      </div>
      <UpgradeButton size="sm" className="mt-4 w-full" />
    </div>
  );
};
