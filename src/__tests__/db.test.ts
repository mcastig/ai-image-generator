const mockNeonFn = jest.fn();
const mockNeon = jest.fn(() => mockNeonFn);
const mockPoolQuery = jest.fn();
const MockPool = jest.fn().mockImplementation(() => ({ query: mockPoolQuery }));

jest.mock("@neondatabase/serverless", () => ({
  neon: mockNeon,
}));

jest.mock("pg", () => ({
  Pool: MockPool,
}));

// Reset module registry between tests so singleton state is cleared
function freshDb() {
  jest.resetModules();

  jest.mock("@neondatabase/serverless", () => ({ neon: mockNeon }));
  jest.mock("pg", () => ({ Pool: MockPool }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/db");
}

describe("getDb — Neon path", () => {
  beforeEach(() => {
    jest.resetModules();
    mockNeon.mockClear();
    mockNeonFn.mockClear();
    MockPool.mockClear();
    mockPoolQuery.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@host.neon.tech/db";
  });

  it("creates a neon client and executes tagged template", async () => {
    const { getDb } = freshDb();
    mockNeonFn.mockResolvedValueOnce([{ id: "1" }]);

    const sql = getDb();
    const rows = await sql`SELECT 1`;
    expect(mockNeon).toHaveBeenCalledWith(process.env.DATABASE_URL);
    expect(mockNeonFn).toHaveBeenCalled();
    expect(rows).toEqual([{ id: "1" }]);
  });

  it("reuses the same neon client on second call", async () => {
    const { getDb } = freshDb();
    mockNeonFn.mockResolvedValue([]);
    getDb();
    getDb();
    expect(mockNeon).toHaveBeenCalledTimes(1);
  });
});

describe("getDb — pg Pool path", () => {
  beforeEach(() => {
    jest.resetModules();
    mockNeon.mockClear();
    mockNeonFn.mockClear();
    MockPool.mockClear();
    mockPoolQuery.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
  });

  it("creates a Pool and executes parameterised query", async () => {
    const { getDb } = freshDb();
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ name: "Alice" }] });

    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE id = ${"abc"}`;
    expect(MockPool).toHaveBeenCalled();
    expect(mockPoolQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE id = $1",
      ["abc"]
    );
    expect(rows).toEqual([{ name: "Alice" }]);
  });

  it("reuses the same pool on second call", async () => {
    const { getDb } = freshDb();
    mockPoolQuery.mockResolvedValue({ rows: [] });
    getDb();
    getDb();
    expect(MockPool).toHaveBeenCalledTimes(1);
  });
});

describe("upsertUser", () => {
  beforeEach(() => {
    jest.resetModules();
    mockNeon.mockClear();
    mockNeonFn.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@host.neon.tech/db";
  });

  it("returns the first row from the query", async () => {
    const { upsertUser } = freshDb();
    const fakeUser = {
      id: "u1",
      github_id: "42",
      name: "Alice",
      email: "alice@example.com",
      avatar_url: "https://avatars.githubusercontent.com/u/42",
      created_at: "2024-01-01",
    };
    mockNeonFn.mockResolvedValueOnce([fakeUser]);

    const result = await upsertUser({
      githubId: "42",
      name: "Alice",
      email: "alice@example.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/42",
    });

    expect(result).toEqual(fakeUser);
  });

  it("passes correct fields to the sql tag", async () => {
    const { upsertUser } = freshDb();
    mockNeonFn.mockResolvedValueOnce([{ id: "u2" }]);

    await upsertUser({ githubId: "7", name: null, email: null, avatarUrl: null });

    expect(mockNeonFn).toHaveBeenCalled();
  });
});
