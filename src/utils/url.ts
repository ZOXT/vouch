import { env } from "../config/env";

/**
 * Public, shareable URLs. The frontend is expected to serve pages at these
 * paths and call the matching API endpoints.
 */
export const getTestimonialRequestUrl = (userSlug: string, token: string) =>
  `${env.APP_URL}/${userSlug}/r/${token}`;

export const getCampaignUrl = (slug: string) => `${env.APP_URL}/c/${slug}`;
