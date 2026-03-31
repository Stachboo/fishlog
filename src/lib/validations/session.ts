import { z } from "zod";

export const createSessionSchema = z.object({
  spotId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  technique: z.string().max(100).optional(),
  bait: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  weatherData: z.record(z.string(), z.unknown()).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
