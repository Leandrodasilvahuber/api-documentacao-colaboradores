import { z } from "zod";

export const recentSubmissionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RecentSubmissionsQuery = z.infer<typeof recentSubmissionsQuerySchema>;
