import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId, save } = await req.json();
  const userId = (session.user as Record<string, unknown>).id as string;
  const sql = getDb();

  if (save) {
    await sql`
      INSERT INTO saved_images (user_id, image_id)
      VALUES (${userId}, ${imageId})
      ON CONFLICT (user_id, image_id) DO NOTHING
    `;
  } else {
    await sql`
      DELETE FROM saved_images WHERE user_id = ${userId} AND image_id = ${imageId}
    `;
  }

  return NextResponse.json({ success: true });
}
