export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      const isRateLimit = err.status === 429;
      const hasRetriesLeft = attempt < maxRetries;

      if (!isRateLimit || !hasRetriesLeft) {
        throw err;
      }

      const delayMs = 2 ** attempt * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
    }
  }
}