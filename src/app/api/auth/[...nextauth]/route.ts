import { handlers } from "@/lib/auth";

// Auth routes are always dynamic — they depend on cookies and request data
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
