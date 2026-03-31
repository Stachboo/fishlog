import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { spots } from "./spots";

export const communityReports = pgTable("community_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  spotId: uuid("spot_id")
    .references(() => spots.id, { onDelete: "cascade" })
    .notNull(),
  reportType: text("report_type").notNull(),
  message: text("message"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type CommunityReport = typeof communityReports.$inferSelect;
export type NewCommunityReport = typeof communityReports.$inferInsert;
