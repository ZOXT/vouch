import { z } from "zod";

export const checkoutContextSchema = z.object({
  plan: z.enum(["pro"]),
});