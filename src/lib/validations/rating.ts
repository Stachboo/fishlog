import { z } from "zod";

export const createRatingSchema = z.object({
  spotId: z.string().uuid("Invalid spot ID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(500, "Comment is too long").optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
