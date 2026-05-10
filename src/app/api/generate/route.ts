import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { textToImageBase64 } from "@/lib/hf";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, negativePrompt, color, resolution, guidance } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let fullPrompt = prompt.trim();
    if (color) fullPrompt += `. Use ${color} as the dominant color.`;
    if (negativePrompt?.trim()) fullPrompt += `. Avoid: ${negativePrompt.trim()}.`;
    if (guidance) fullPrompt += `. Style intensity: ${guidance}/10.`;

    const imageUrl = await textToImageBase64(fullPrompt, resolution ?? "1024x1024");
    const seed = Math.floor(Math.random() * 999999999);

    const sql = getDb();
    const userId = (session.user as Record<string, unknown>).id as string;

    const [image] = await sql`
      INSERT INTO images (user_id, prompt, negative_prompt, color, resolution, guidance, image_url, seed)
      VALUES (${userId}, ${prompt}, ${negativePrompt ?? null}, ${color ?? null}, ${resolution ?? "1024x1024"}, ${guidance ?? 5}, ${imageUrl}, ${seed})
      RETURNING *
    `;

    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/generate]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
