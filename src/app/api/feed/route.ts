import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as Record<string, unknown>)?.id as string | null ?? null;
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? null;

  const sql = getDb();

  // LEFT JOIN saved_images with userId — when userId is null the join produces no match,
  // so is_saved will always be false for unauthenticated users.
  let images;
  if (query) {
    images = await sql`
      SELECT i.*, u.name AS author_name, u.avatar_url AS author_avatar,
        (s.id IS NOT NULL) AS is_saved
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN saved_images s ON s.image_id = i.id AND s.user_id = ${userId}
      WHERE to_tsvector('english', i.prompt) @@ plainto_tsquery('english', ${query})
        OR i.prompt ILIKE ${"%" + query + "%"}
      ORDER BY i.created_at DESC
      LIMIT 50
    `;
  } else {
    images = await sql`
      SELECT i.*, u.name AS author_name, u.avatar_url AS author_avatar,
        (s.id IS NOT NULL) AS is_saved
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN saved_images s ON s.image_id = i.id AND s.user_id = ${userId}
      ORDER BY i.created_at DESC
      LIMIT 50
    `;
  }

  return NextResponse.json({ images });
}
