import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { textToImageBase64 } from "@/lib/hf";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const [source] = await sql`SELECT * FROM images WHERE id = ${imageId}`;
    if (!source) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let fullPrompt = String(source.prompt);
    if (source.color) fullPrompt += `. Use ${source.color} as the dominant color.`;
    if (source.negative_prompt) fullPrompt += `. Avoid: ${source.negative_prompt}.`;
    if (source.guidance) fullPrompt += `. Style intensity: ${source.guidance}/10.`;

    const resolution = (source.resolution as string) ?? "1024x1024";
    const imageUrl = await textToImageBase64(fullPrompt, resolution);
    const seed = Math.floor(Math.random() * 999999999);
    const userId = (session.user as Record<string, unknown>).id as string;

    const [image] = await sql`
      INSERT INTO images (user_id, prompt, negative_prompt, color, resolution, guidance, image_url, seed)
      VALUES (${userId}, ${source.prompt}, ${source.negative_prompt}, ${source.color}, ${source.resolution}, ${source.guidance}, ${imageUrl}, ${seed})
      RETURNING *
    `;

    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/image/generate]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
