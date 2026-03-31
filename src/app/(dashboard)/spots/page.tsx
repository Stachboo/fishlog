// Spots page — server shell (gets current user), client map inside

import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { SpotsClient } from "./spots-client";

export default async function SpotsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <SpotsClient currentUserId={user.id} />;
}
