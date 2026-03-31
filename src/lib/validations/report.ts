import { z } from "zod";

const REPORT_TYPES = [
  "biting",
  "not_biting",
  "good_conditions",
  "bad_conditions",
  "crowded",
] as const;

export const createReportSchema = z.object({
  spotId: z.string().uuid("Invalid spot ID"),
  reportType: z.enum(REPORT_TYPES, {
    message: `Report type must be one of: ${REPORT_TYPES.join(", ")}`,
  }),
  message: z.string().max(300, "Message is too long").optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportType = (typeof REPORT_TYPES)[number];
export { REPORT_TYPES };
