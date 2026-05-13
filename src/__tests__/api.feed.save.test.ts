/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockGetDb = jest.fn();

jest.mock("@/auth", () => ({ auth: mockAuth }));
jest.mock("@/lib/db", () => ({ getDb: mockGetDb }));

import { POST } from "@/app/api/feed/save/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/feed/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/feed/save", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ imageId: "1", save: true }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("inserts saved_images when save=true", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const sqlTag = jest.fn().mockResolvedValue([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest({ imageId: "img1", save: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(sqlTag).toHaveBeenCalled();
  });

  it("deletes from saved_images when save=false", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const sqlTag = jest.fn().mockResolvedValue([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await POST(makeRequest({ imageId: "img1", save: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(sqlTag).toHaveBeenCalled();
  });
});
