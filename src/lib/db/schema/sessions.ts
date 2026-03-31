import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { spots } from "./spots";

export const fishingSessions = pgTable(
  "fishing_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    spotId: uuid("spot_id").references(() => spots.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    technique: text("technique"),
    bait: text("bait"),
    notes: text("notes"),
    weatherData: jsonb("weather_data"),
    score: integer("score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("fishing_sessions_user_id_idx").on(table.userId),
    index("fishing_sessions_date_idx").on(table.date),
  ]
);

export type FishingSession = typeof fishingSessions.$inferSelect;
export type NewFishingSession = typeof fishingSessions.$inferInsert;
