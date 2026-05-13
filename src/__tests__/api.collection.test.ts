/**
 * @jest-environment node
 */
const mockAuth = jest.fn();
const mockGetDb = jest.fn();

jest.mock("@/auth", () => ({ auth: mockAuth }));
jest.mock("@/lib/db", () => ({ getDb: mockGetDb }));

import { GET } from "@/app/api/collection/route";

describe("GET /api/collection", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns saved images for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const fakeImages = [{ id: "img1", prompt: "cat", is_saved: true }];
    const sqlTag = jest.fn().mockResolvedValueOnce(fakeImages);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toEqual(fakeImages);
  });

  it("returns empty array when collection is empty", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u2" } });
    const sqlTag = jest.fn().mockResolvedValueOnce([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toEqual([]);
  });
});
