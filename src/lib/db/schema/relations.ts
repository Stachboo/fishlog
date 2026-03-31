import { relations } from "drizzle-orm";
import { users } from "./users";
import { accounts, authSessions } from "./auth";
import { spots } from "./spots";
import { spotRatings } from "./spot-ratings";
import { fishingSessions } from "./sessions";
import { communityReports } from "./community-reports";
import { pushSubscriptions } from "./push-subscriptions";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  authSessions: many(authSessions),
  spots: many(spots),
  fishingSessions: many(fishingSessions),
  spotRatings: many(spotRatings),
  communityReports: many(communityReports),
  pushSubscriptions: many(pushSubscriptions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const spotsRelations = relations(spots, ({ one, many }) => ({
  user: one(users, {
    fields: [spots.userId],
    references: [users.id],
  }),
  ratings: many(spotRatings),
  fishingSessions: many(fishingSessions),
  communityReports: many(communityReports),
}));

export const spotRatingsRelations = relations(spotRatings, ({ one }) => ({
  spot: one(spots, {
    fields: [spotRatings.spotId],
    references: [spots.id],
  }),
  user: one(users, {
    fields: [spotRatings.userId],
    references: [users.id],
  }),
}));

export const fishingSessionsRelations = relations(fishingSessions, ({ one }) => ({
  user: one(users, {
    fields: [fishingSessions.userId],
    references: [users.id],
  }),
  spot: one(spots, {
    fields: [fishingSessions.spotId],
    references: [spots.id],
  }),
}));

export const communityReportsRelations = relations(communityReports, ({ one }) => ({
  user: one(users, {
    fields: [communityReports.userId],
    references: [users.id],
  }),
  spot: one(spots, {
    fields: [communityReports.spotId],
    references: [spots.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));
