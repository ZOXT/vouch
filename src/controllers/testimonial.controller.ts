import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { generatePresignedUploadUrl } from "../services/s3.service";
import {confirmTestimonialUpload, publishTestimonial, softDeleteTestimonial, getTestimonialById, getTestimonials, getTestimonialCaptions} from "../services/testimonial.service";


export const listTestimonials = asyncHandler(async (req, res) => {
  const userId = (req.user as { id: string }).id;
  
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
  const status = req.query.status as string | undefined;
  const isPublished = req.query.isPublished !== undefined 
    ? req.query.isPublished === "true" 
    : undefined;
  const sortBy = req.query.sortBy as string || "created_at";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
  const search = req.query.search as string | undefined;

  if (page < 1 || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  const result = await getTestimonials({
    userId,
    page,
    limit,
    status,
    isPublished,
    sortBy,
    sortOrder,
    search,
  });

  res.status(200).json(new ApiResponse(200, result, "Testimonials retrieved successfully"));
});


export const getTestimonial = asyncHandler(async (req,res) => {
  const { id } = req.params;
  const userId = (req.user as { id: string }).id;

  if (!id || typeof id !== "string") {
    throw new ApiError(400, "Invalid testimonial id");
  }

  const testimonial = await getTestimonialById(id, userId);
  res.status(200).json(new ApiResponse(200, testimonial, "Testimonial retrieved successfully"));
});


export const getCaptions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = (req.user as { id: string }).id;

  if (!id || typeof id !== "string") {
    throw new ApiError(400, "Invalid testimonial id");
  }

  const vtt = await getTestimonialCaptions(id, userId);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.status(200).type("text/vtt").send(vtt);
});


export const getUploadUrl = asyncHandler(async(req,res) =>{
    const {fileName, fileType, token} = req.body;

    const {url, key} = await generatePresignedUploadUrl(fileName, fileType, token);

    res.status(200).json(
        new ApiResponse(200, {url, key}, "Upload URL generated")
    )

});
export const confirmUpload = asyncHandler(async (req, res) => {
  const { token, key, duration, mimeType, clientDesignation } = req.body;

  const testimonial = await confirmTestimonialUpload(token, key, duration, mimeType, clientDesignation);

  res.status(201).json(
    new ApiResponse(201, testimonial, "Testimonial submitted successfully")
  );
});

export const publish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "Invalid testimonial id");
  }

  const testimonial = await publishTestimonial(id, req.user!.id);

  const publishResponse = {
    id: testimonial.id,
    isPublished: testimonial.is_published,
    publishedAt: testimonial.published_at,
  };

  res.status(200).json(new ApiResponse(200, publishResponse, "Testimonial published"));
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = (req.user as { id: string }).id;

  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "Invalid testimonial id");
  }

  await softDeleteTestimonial(id, userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Testimonial deleted successfully",
      ),
    );
});