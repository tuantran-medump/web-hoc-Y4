import { describe, expect, it } from "vitest";
import type { ApiResponse } from "@/types";

describe("Shared Data Contracts (src/types/index.ts)", () => {
  it("constructs a valid ApiResponse object", () => {
    const res: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: "ok" },
    };
    expect(res.success).toBe(true);
    expect(res.data?.status).toBe("ok");
  });
});
