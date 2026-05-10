import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;
  const session = await auth();
  const userId = (session?.user as Record<string, unknown>)?.id as string | null ?? null;
  const sql = getDb();

  const rows = await sql`
    SELECT i.*, u.name AS author_name, u.avatar_url AS author_avatar,
      (s.id IS NOT NULL) AS is_saved
    FROM images i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN saved_images s ON s.image_id = i.id AND s.user_id = ${userId}
    WHERE i.id = ${imageId}
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ image: rows[0] });
}
