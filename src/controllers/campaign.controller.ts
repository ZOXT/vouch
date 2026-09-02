import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createCampaign,
  deleteCampaign,
  generateCampaignUploadUrl,
  getCampaignById,
  getCampaigns,
  getPublicCampaign,
  submitCampaignTestimonial,
  updateCampaign,
} from "../services/campaign.service";

const getUserId = (user: Express.Request["user"]) => {
  if (!user?.id) throw new ApiError(401, "Unauthorized");
  return user.id;
};

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `Valid campaign ${name} is required`);
  }
  return value;
};

export const createCampaignController = asyncHandler(async (req, res) => {
  const campaign = await createCampaign(getUserId(req.user), req.body);
  res.status(201).json(new ApiResponse(201, campaign, "Campaign created successfully"));
});

export const listCampaignsController = asyncHandler(async (req, res) => {
  const campaigns = await getCampaigns(getUserId(req.user));
  res.status(200).json(new ApiResponse(200, campaigns, "Campaigns retrieved successfully"));
});

export const getCampaignController = asyncHandler(async (req, res) => {
  const campaignId = getRouteParam(req.params.id, "ID");
  const campaign = await getCampaignById(getUserId(req.user), campaignId);
  res.status(200).json(new ApiResponse(200, campaign, "Campaign retrieved successfully"));
});

export const updateCampaignController = asyncHandler(async (req, res) => {
  const campaignId = getRouteParam(req.params.id, "ID");
  const campaign = await updateCampaign(getUserId(req.user), campaignId, req.body);
  res.status(200).json(new ApiResponse(200, campaign, "Campaign updated successfully"));
});

export const deleteCampaignController = asyncHandler(async (req, res) => {
  const campaignId = getRouteParam(req.params.id, "ID");
  const result = await deleteCampaign(getUserId(req.user), campaignId);
  res.status(200).json(new ApiResponse(200, result, "Campaign deleted successfully"));
});

export const getPublicCampaignController = asyncHandler(async (req, res) => {
  const slug = getRouteParam(req.params.slug, "slug");
  const campaign = await getPublicCampaign(slug);
  res.status(200).json(new ApiResponse(200, campaign, "Campaign retrieved successfully"));
});

export const getCampaignUploadUrlController = asyncHandler(async (req, res) => {
  const slug = getRouteParam(req.params.slug, "slug");
  const { fileName, fileType } = req.body;
  const result = await generateCampaignUploadUrl(slug, fileName, fileType);
  res.status(200).json(new ApiResponse(200, result, "Upload URL generated"));
});

export const submitCampaignTestimonialController = asyncHandler(async (req, res) => {
  const slug = getRouteParam(req.params.slug, "slug");
  const testimonial = await submitCampaignTestimonial(slug, req.body);
  res.status(201).json(new ApiResponse(201, testimonial, "Testimonial submitted successfully"));
});
