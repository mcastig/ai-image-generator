/**
 * @jest-environment node
 */
const mockUpsertUser = jest.fn();
const mockNextAuth = jest.fn().mockReturnValue({
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
});
const mockGitHub = { id: "github" };

jest.mock("@/lib/db", () => ({ upsertUser: mockUpsertUser }));
jest.mock("next-auth/providers/github", () => ({ __esModule: true, default: mockGitHub }));
jest.mock("next-auth", () => ({
  __esModule: true,
  default: mockNextAuth,
}));

import "@/auth";

describe("auth configuration", () => {
  it("calls NextAuth with GitHub provider", () => {
    expect(mockNextAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: expect.arrayContaining([mockGitHub]),
      })
    );
  });

  it("has jwt and session callbacks", () => {
    const config = mockNextAuth.mock.calls[0][0];
    expect(config.callbacks).toHaveProperty("jwt");
    expect(config.callbacks).toHaveProperty("session");
  });
});

describe("jwt callback", () => {
  async function callJwt(args: { token: Record<string, unknown>; account?: unknown; profile?: unknown }) {
    const config = mockNextAuth.mock.calls[0][0];
    return config.callbacks.jwt(args);
  }

  beforeEach(() => {
    mockUpsertUser.mockReset();
  });

  it("returns token unchanged when account is not github", async () => {
    const token = { sub: "123" };
    const result = await callJwt({ token, account: { provider: "email" }, profile: {} });
    expect(result).toEqual(token);
    expect(mockUpsertUser).not.toHaveBeenCalled();
  });

  it("returns token unchanged when account is null", async () => {
    const token = { sub: "abc" };
    const result = await callJwt({ token, account: null });
    expect(result).toEqual(token);
  });

  it("upserts user and enriches token on github sign-in", async () => {
    mockUpsertUser.mockResolvedValueOnce({ id: "db-user-1" });
    const token = {};
    const account = { provider: "github" };
    const profile = { id: 42, login: "alice", name: "Alice", email: "alice@example.com", avatar_url: "https://avatars.github.com/u/42" };

    const result = await callJwt({ token, account, profile });

    expect(mockUpsertUser).toHaveBeenCalledWith({
      githubId: "42",
      name: "Alice",
      email: "alice@example.com",
      avatarUrl: "https://avatars.github.com/u/42",
    });
    expect(result.dbUserId).toBe("db-user-1");
    expect(result.avatarUrl).toBe("https://avatars.github.com/u/42");
    expect(result.userName).toBe("Alice");
  });

  it("falls back to login when name is absent", async () => {
    mockUpsertUser.mockResolvedValueOnce({ id: "db-user-2" });
    const token = {};
    const account = { provider: "github" };
    const profile = { id: 7, login: "bob_login" };

    const result = await callJwt({ token, account, profile });

    expect(mockUpsertUser).toHaveBeenCalledWith(expect.objectContaining({ name: "bob_login" }));
    expect(result.userName).toBe("bob_login");
  });

  it("uses null as name when both name and login are absent", async () => {
    mockUpsertUser.mockResolvedValueOnce({ id: "db-4" });
    const token = {};
    const account = { provider: "github" };
    const profile = { id: 55 };  // no login, no name

    const result = await callJwt({ token, account, profile });
    expect(mockUpsertUser).toHaveBeenCalledWith(expect.objectContaining({ name: null }));
    expect(result.userName).toBeUndefined();
  });

  it("handles null email and avatar gracefully", async () => {
    mockUpsertUser.mockResolvedValueOnce({ id: "db-3" });
    const token = {};
    const account = { provider: "github" };
    const profile = { id: 99, login: "carol" };

    const result = await callJwt({ token, account, profile });
    expect(result.dbUserId).toBe("db-3");
    expect(result.avatarUrl).toBeNull();
  });
});

describe("session callback", () => {
  async function callSession(args: { session: Record<string, unknown>; token: Record<string, unknown> }) {
    const config = mockNextAuth.mock.calls[0][0];
    return config.callbacks.session(args);
  }

  it("adds id and avatarUrl to session.user", async () => {
    const session = { user: { name: "Alice" } };
    const token = { dbUserId: "db-1", avatarUrl: "https://example.com/avatar.png" };

    const result = await callSession({ session, token });
    expect((result.user as Record<string, unknown>).id).toBe("db-1");
    expect((result.user as Record<string, unknown>).avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("returns session unchanged when user is null", async () => {
    const session = { user: null };
    const token = { dbUserId: "db-1" };
    const result = await callSession({ session, token });
    expect(result.user).toBeNull();
  });
});
