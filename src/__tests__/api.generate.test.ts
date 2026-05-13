/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockGetDb = jest.fn();
const mockTextToImageBase64 = jest.fn();

jest.mock("@/auth", () => ({ auth: mockAuth }));
jest.mock("@/lib/db", () => ({ getDb: mockGetDb }));
jest.mock("@/lib/hf", () => ({ textToImageBase64: mockTextToImageBase64 }));

import { POST } from "@/app/api/generate/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
    mockTextToImageBase64.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ prompt: "cat" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when prompt is missing", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await POST(makeRequest({ prompt: "   " }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Prompt is required");
  });

  it("returns 400 when prompt is empty string", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await POST(makeRequest({ prompt: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when prompt is null (optional chaining null branch)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const res = await POST(makeRequest({ prompt: null }));
    expect(res.status).toBe(400);
  });

  it("generates an image and returns it on success", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,abc");
    const fakeImage = { id: "img1", prompt: "a cat", image_url: "data:image/png;base64,abc" };
    const sqlTag = jest.fn().mockResolvedValueOnce([fakeImage]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest({ prompt: "a cat", resolution: "1024x1024", guidance: 5 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image).toEqual(fakeImage);
  });

  it("appends color modifier to prompt when color is provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,x");
    const sqlTag = jest.fn().mockResolvedValueOnce([{ id: "1" }]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    await POST(makeRequest({ prompt: "a cat", color: "#FF0000" }));

    const calledPrompt = mockTextToImageBase64.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("Use #FF0000 as the dominant color");
  });

  it("appends negative prompt modifier when negativePrompt is provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,x");
    const sqlTag = jest.fn().mockResolvedValueOnce([{ id: "1" }]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    await POST(makeRequest({ prompt: "a cat", negativePrompt: "blurry" }));

    const calledPrompt = mockTextToImageBase64.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("Avoid: blurry");
  });

  it("appends guidance modifier when guidance is provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,x");
    const sqlTag = jest.fn().mockResolvedValueOnce([{ id: "1" }]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    await POST(makeRequest({ prompt: "a cat", guidance: 8 }));

    const calledPrompt = mockTextToImageBase64.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("Style intensity: 8/10");
  });

  it("returns 500 on unexpected error", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockRejectedValueOnce(new Error("HF down"));
    const sqlTag = jest.fn();
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest({ prompt: "a cat" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("HF down");
  });

  it("returns 500 with generic message for non-Error throws", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockTextToImageBase64.mockRejectedValueOnce("string error");
    const sqlTag = jest.fn();
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest({ prompt: "a cat" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
