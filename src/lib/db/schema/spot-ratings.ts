import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { spots } from "./spots";

export const spotRatings = pgTable(
  "spot_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spotId: uuid("spot_id")
      .references(() => spots.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("spot_ratings_spot_user_unique").on(table.spotId, table.userId),
  ]
);

export type SpotRating = typeof spotRatings.$inferSelect;
export type NewSpotRating = typeof spotRatings.$inferInsert;
