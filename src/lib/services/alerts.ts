// Trigger push notifications when a new community report is created.

import type { CommunityReport } from "@/lib/db/schema";
import { notifyZone } from "./push";

const ZONE_RADIUS_KM = 20;

// Friendly label map for notification messages
const TYPE_LABELS: Record<string, string> = {
  biting: "Ça mord",
  not_biting: "Ça ne mord pas",
  good_conditions: "Bonnes conditions",
  bad_conditions: "Mauvaises conditions",
  crowded: "Spot bondé",
};

/**
 * Trigger push notifications to nearby users when a new report is created.
 * Respects the ENABLE_PUSH feature flag.
 */
export async function triggerAlerts(
  report: CommunityReport,
  spotName: string
): Promise<void> {
  if (process.env.ENABLE_PUSH !== "true") return;

  const typeLabel = TYPE_LABELS[report.reportType] ?? report.reportType;

  const isBiting = report.reportType === "biting";
  const title = isBiting
    ? `🎣 Ça mord à ${spotName} !`
    : `${typeLabel} signalé près de ${spotName}`;

  const body = report.message
    ? report.message
    : isBiting
      ? "Un pêcheur a signalé une bonne activité. C'est le moment !"
      : `Conditions : ${typeLabel}`;

  await notifyZone(report.latitude, report.longitude, ZONE_RADIUS_KM, {
    title,
    body,
    icon: "/icon-192.png",
    url: "/alerts",
  });
}
