import { createTestimonialRequest, getTestimonialRequestByToken } from "../services/testimonial-request.service"; 
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";


export const RequestTestimonial = asyncHandler(async (req,res)=> {
    const {clientName, clientEmail} = req.body;
    const userId = req.user!.id;


    const {request, url} = await createTestimonialRequest(userId, clientName, clientEmail);
    res.status(201).json(
        new ApiResponse(201, {request, url}, "Testimonial Request Creaated!")
    );
});

export const getRequestByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

if (!token || Array.isArray(token)) {
  throw new ApiError(400, "Invalid token");
}

const request = await getTestimonialRequestByToken(token);
  res.status(200).json(new ApiResponse(200, request, "Request found"));
});