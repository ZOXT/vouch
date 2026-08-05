import "dotenv/config";
import { prisma } from "../config/prisma";

const inspectFailed = async () => {
  const failedJobs = await prisma.failedJob.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
  });

  console.log(`Showing ${failedJobs.length} failed jobs`);
  failedJobs.forEach((job) => {
    console.log(`---\nID: ${job.id}\nqueue: ${job.queue_name}\nstatus: ${job.status}\ncategory: ${job.category}\nerror: ${job.error_message}\nattempts: ${job.attempts}\ncreated: ${job.created_at}\n`);
  });

  process.exit(0);
};

inspectFailed().catch((error) => {
  console.error("DLQ inspect failed", error);
  process.exit(1);
});
