import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json({ error: "No Square integration found" }, { status: 404 });
    }

    const isSandbox = process.env.NODE_ENV !== "production";
    const revokeUrl = isSandbox
      ? "https://connect.squareupsandbox.com/oauth2/revoke"
      : "https://connect.squareup.com/oauth2/revoke";

    const clientId = process.env.SQUARE_CLIENT_ID;

    if (clientId) {
      try {
        await fetch(revokeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Client ${process.env.SQUARE_CLIENT_SECRET}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            access_token: integration.accessToken,
          }),
        });
      } catch (revokeError) {
        console.error("Failed to revoke Square token:", revokeError);
      }
    }

    await db.squareIntegration.delete({
      where: { id: integration.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Square disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
