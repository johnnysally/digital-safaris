import { describe, expect, it } from "vitest";
import { parseRefreshResponse, unwrap, unwrapList } from "./axios";

describe("API response helpers", () => {
  it("unwraps a standard API envelope", () => {
    expect(unwrap({ statusCode: 200, data: { id: "partner-1" }, success: true })).toEqual({
      id: "partner-1",
    });
  });

  it("normalizes paginated lists from API envelopes", () => {
    expect(
      unwrapList({
        statusCode: 200,
        data: { items: [{ id: "review-1" }], total: 1, page: 1, limit: 4 },
        success: true,
      }),
    ).toEqual({
      data: [{ id: "review-1" }],
      meta: { page: 1, limit: 4, total: 1, totalPages: 1 },
    });
  });
});

describe("parseRefreshResponse", () => {
  it("reads the backend's enveloped token response", () => {
    expect(
      parseRefreshResponse({
        statusCode: 200,
        data: { accessToken: "access-token" },
        message: "Token refreshed",
        success: true,
      }),
    ).toEqual({ accessToken: "access-token" });
  });

  it("continues to accept an unwrapped token response", () => {
    expect(
      parseRefreshResponse({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      }),
    ).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" });
  });

  it("rejects a response without an access token", () => {
    expect(() =>
      parseRefreshResponse({ statusCode: 200, data: {}, success: true }),
    ).toThrow("The token refresh response did not contain an access token.");
  });
});
