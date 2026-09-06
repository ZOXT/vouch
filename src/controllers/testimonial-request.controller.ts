import { createTestimonialRequest, getTestimonialRequestByToken, listTestimonialRequests, resendTestimonialRequest} from "../services/testimonial-request.service"; 
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { getAvatarUrl } from "../utils/media";


export const RequestTestimonial = asyncHandler(async (req,res)=> {
    const { clientName, clientEmail, title, message, questions } = req.body;
    const userId = req.user!.id;


    const {request, url} = await createTestimonialRequest(userId, clientName, clientEmail, title, message, questions);
    res.status(201).json(
        new ApiResponse(201, {request, url}, "Testimonial Request Creaated!")
    );
});

export const listRequests = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const requests = await listTestimonialRequests(userId);
  res.status(200).json(new ApiResponse(200, requests, "Testimonial requests retrieved"));
});

export const getRequestByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

if (!token || Array.isArray(token)) {
  throw new ApiError(400, "Invalid token");
}
const request = await getTestimonialRequestByToken(token);

const publicRequest = {
    clientName: request.client_name,
    status: request.status,
    expiresAt: request.expires_at,
     title: request.title,
    message: request.message,
    questions: request.questions,
    logoUrl: getAvatarUrl(request.user.avatar_url),
    companyUrl: request.user.company_url,
    companyName: request.user.company_name,
  };
  
  res.status(200).json(new ApiResponse(200, publicRequest, "Request found"));
});

export const resendRequest = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  if (!id) throw new ApiError(400, "Request ID is required");

  await resendTestimonialRequest(userId, id);
  res.status(200).json(new ApiResponse(200, null, "Invite email resent"));
});
