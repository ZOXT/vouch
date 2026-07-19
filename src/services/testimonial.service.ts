import {prisma} from "../config/prisma";
import {env} from "../config/env"
import { markRequestCompleted } from "./testimonial-request.service";


export const confirmTestimonialUpload = async(
    token: string,
    key: string,
    duration? : number
 ) =>{


    const request = await markRequestCompleted(token);

    const testimonial = await prisma.testimonial.create({
        data: {
            user_id : request.user_id,
            client_name: request.client_name,
            client_email: request.client_email,
             video_url: `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
            status: "pending",
            duration,
}
  });

  return testimonial;
};