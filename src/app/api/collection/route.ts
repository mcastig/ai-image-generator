import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const sql = getDb();

  const images = await sql`
    SELECT i.*, u.name AS author_name, u.avatar_url AS author_avatar, true AS is_saved
    FROM saved_images si
    JOIN images i ON si.image_id = i.id
    LEFT JOIN users u ON i.user_id = u.id
    WHERE si.user_id = ${userId}
    ORDER BY si.created_at DESC
  `;

  return NextResponse.json({ images });
}
