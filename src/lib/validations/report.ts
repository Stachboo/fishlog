import { z } from "zod";

const REPORT_TYPES = ["biting", "not_biting", "crowded", "clear", "hazard"] as const;

export const createReportSchema = z.object({
  spotId: z.string().uuid("Invalid spot ID"),
  reportType: z.enum(REPORT_TYPES, {
    error: `Report type must be one of: ${REPORT_TYPES.join(", ")}`,
  }),
  message: z.string().max(300, "Message is too long").optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  expiresAt: z.string().datetime().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
