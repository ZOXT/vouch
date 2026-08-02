import "dotenv/config";
import { mediaQueue } from "../src/queues/media.queue";

const testimonialId = "855bd01d-86fc-4f62-ac70-dae8d429c7d6";

await mediaQueue.add("process", { testimonialId });
console.log("Job queued for", testimonialId);
process.exit(0);