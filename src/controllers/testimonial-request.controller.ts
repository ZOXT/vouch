import {createTestimonialRequest} from "../services/testimonial-request.service" 
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


export const RequestTestimonial = asyncHandler(async (req,res)=> {
    const {clientName, clientEmail} = req.body;
    const userId = req.user!.id;


    const {request, url} = await createTestimonialRequest(userId, clientName, clientEmail);
    res.status(201).json(
        new ApiResponse(201, {request, url}, "Testimonial Request Creaated!")
    );
});