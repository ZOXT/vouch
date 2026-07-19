import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generatePresignedUploadUrl } from "../services/s3.service";
import {confirmTestimonialUpload} from "../services/testimonial.service";


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