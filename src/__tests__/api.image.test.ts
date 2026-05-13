/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockGetDb = jest.fn();

jest.mock("@/auth", () => ({ auth: mockAuth }));
jest.mock("@/lib/db", () => ({ getDb: mockGetDb }));

import { GET } from "@/app/api/image/[imageId]/route";

function makeRequest() {
  return new NextRequest("http://localhost/api/image/img1");
}

function makeParams(imageId: string) {
  return { params: Promise.resolve({ imageId }) };
}

describe("GET /api/image/[imageId]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
  });

  it("returns 404 when image not found", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const sqlTag = jest.fn().mockResolvedValueOnce([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest(), makeParams("nonexistent"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns image when found (unauthenticated)", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const fakeImage = { id: "img1", prompt: "cat" };
    const sqlTag = jest.fn().mockResolvedValueOnce([fakeImage]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest(), makeParams("img1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image).toEqual(fakeImage);
  });

  it("returns image with is_saved flag for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const fakeImage = { id: "img1", prompt: "dog", is_saved: true };
    const sqlTag = jest.fn().mockResolvedValueOnce([fakeImage]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest(), makeParams("img1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image.is_saved).toBe(true);
  });
});
