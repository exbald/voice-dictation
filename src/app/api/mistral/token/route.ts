import { headers } from "next/headers";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import { auth } from "@/lib/auth";

/**
 * GET /api/mistral/token
 *
 * Verifies the user has a Mistral API key and returns the proxy WebSocket URL.
 * The actual API key is never exposed to the client — the proxy handles auth.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(session.user.id, "mistral");

  if (!apiKey) {
    return Response.json(
      {
        error: "No Mistral API key configured",
        code: "NO_API_KEY",
        message: "Add your Mistral API key in Settings",
      },
      { status: 400 }
    );
  }

  // Return proxy URL — the proxy authenticates upstream with Bearer token
  const appUrl = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
  const protocol = appUrl.protocol === "https:" ? "wss" : "ws";
  const websocketUrl = `${protocol}://${appUrl.host}/api/mistral/ws`;

  return Response.json(
    { websocketUrl },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
