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

import { POST } from "@/app/api/image/[imageId]/generate/route";

function makeRequest() {
  return new NextRequest("http://localhost/api/image/img1/generate", { method: "POST" });
}
function makeParams(imageId: string) {
  return { params: Promise.resolve({ imageId }) };
}

describe("POST /api/image/[imageId]/generate", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
    mockTextToImageBase64.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const sqlTag = jest.fn();
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest(), makeParams("img1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when source image not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const sqlTag = jest.fn().mockResolvedValueOnce([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest(), makeParams("missing"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("generates a new image from source settings", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const source = {
      id: "src1",
      prompt: "a mountain",
      color: "#0000FF",
      negative_prompt: "blurry",
      guidance: 7,
      resolution: "1024x1024",
    };
    const newImage = { id: "new1", prompt: "a mountain" };
    const sqlTag = jest.fn()
      .mockResolvedValueOnce([source])
      .mockResolvedValueOnce([newImage]);
    mockGetDb.mockReturnValueOnce(sqlTag);
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,xyz");

    const res = await POST(makeRequest(), makeParams("src1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image).toEqual(newImage);

    const calledPrompt = mockTextToImageBase64.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("a mountain");
    expect(calledPrompt).toContain("#0000FF");
    expect(calledPrompt).toContain("blurry");
    expect(calledPrompt).toContain("7/10");
  });

  it("generates without optional source fields (covers all falsy branches)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const source = {
      id: "src2",
      prompt: "just a prompt",
      color: null,
      negative_prompt: null,
      guidance: 0,
      resolution: null,
    };
    const newImage = { id: "new2", prompt: "just a prompt" };
    const sqlTag = jest.fn()
      .mockResolvedValueOnce([source])
      .mockResolvedValueOnce([newImage]);
    mockGetDb.mockReturnValueOnce(sqlTag);
    mockTextToImageBase64.mockResolvedValueOnce("data:image/png;base64,xyz");

    const res = await POST(makeRequest(), makeParams("src2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image).toEqual(newImage);
    // With null resolution, should fall back to default "1024x1024"
    expect(mockTextToImageBase64.mock.calls[0][1]).toBe("1024x1024");
  });

  it("returns 500 on unexpected error with Error message", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const sqlTag = jest.fn().mockRejectedValueOnce(new Error("DB error"));
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest(), makeParams("img1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB error");
  });

  it("returns 500 with generic message for non-Error throws", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const sqlTag = jest.fn().mockRejectedValueOnce("fail");
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest(), makeParams("img1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
