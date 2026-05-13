/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockGetDb = jest.fn();

jest.mock("@/auth", () => ({ auth: mockAuth }));
jest.mock("@/lib/db", () => ({ getDb: mockGetDb }));

import { GET } from "@/app/api/feed/route";

function makeRequest(url: string) {
  return new NextRequest(url);
}

describe("GET /api/feed", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetDb.mockReset();
  });

  it("returns images without search query", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const fakeImages = [{ id: "1", prompt: "cat" }];
    const sqlTag = jest.fn().mockResolvedValueOnce(fakeImages);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest("http://localhost/api/feed"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toEqual(fakeImages);
  });

  it("passes search query to sql when q param is provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    const fakeImages = [{ id: "2", prompt: "dog" }];
    const sqlTag = jest.fn().mockResolvedValueOnce(fakeImages);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest("http://localhost/api/feed?q=dog"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toEqual(fakeImages);
    expect(sqlTag).toHaveBeenCalled();
  });

  it("works when user is authenticated (userId passed to sql)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u2" } });
    const sqlTag = jest.fn().mockResolvedValueOnce([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest("http://localhost/api/feed"));
    expect(res.status).toBe(200);
  });

  it("trims whitespace from q param", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const sqlTag = jest.fn().mockResolvedValueOnce([]);
    mockGetDb.mockReturnValueOnce(sqlTag);

    const res = await GET(makeRequest("http://localhost/api/feed?q=  cat  "));
    expect(res.status).toBe(200);
  });
});
