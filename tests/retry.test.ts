import { vi } from "vitest";
import { withRetry } from "../src/utils/retry.js";

describe("withRetry", () => {
  it("reintenta ante un error 429 y eventualmente resuelve", async () => {
    vi.useFakeTimers();

    let attempts = 0;
    const operation = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw { status: 429 };
      }
      return "ok";
    });

    const promise = withRetry(operation, 5);

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it("no reintenta ante un error que no es 429 (falla inmediato)", async () => {
    const operation = vi.fn(async () => {
      throw { status: 404 };
    });

    await expect(withRetry(operation, 5)).rejects.toEqual({ status: 404 });

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
