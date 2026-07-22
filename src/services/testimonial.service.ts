import {prisma} from "../config/prisma";
import {env} from "../config/env"
import {transcriptionQueue, TranscriptionJobData} from "../queues/transcription.queue"
import { markRequestCompleted } from "./testimonial-request.service";
import "dotenv/config";



export const confirmTestimonialUpload = async (
  token: string,
  key: string,
  duration?: number
) => {
  const request = await markRequestCompleted(token);

  const testimonial = await prisma.testimonial.create({
    data: {
      user_id: request.user_id,
      client_name: request.client_name,
      client_email: request.client_email,
      video_url: `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
      status: "pending",
      duration,
    }
  });

  // Push job to queue
  await transcriptionQueue.add(
    "transcribe",
    {
      testimonialId: testimonial.id,
      videoUrl: testimonial.video_url,
      userId: testimonial.user_id,
    } as TranscriptionJobData,
    {
      jobId: testimonial.id, 
    }
  );

  return testimonial;
};