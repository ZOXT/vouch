import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { generatePresignedUploadUrl } from "../services/s3.service";
import {confirmTestimonialUpload, publishTestimonial} from "../services/testimonial.service";


export const getUploadUrl = asyncHandler(async(req,res) =>{
    const {fileName, fileType, token} = req.body;

    const {url, key} = await generatePresignedUploadUrl(fileName, fileType, token);

    res.status(200).json(
        new ApiResponse(200, {url, key}, "Upload URL generated")
    )

});
export const confirmUpload = asyncHandler(async (req, res) => {
  const { token, key, duration } = req.body;

  const testimonial = await confirmTestimonialUpload(token, key, duration);

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