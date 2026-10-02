export class AuthRateLimiter {
  private readonly hits = new Map<string, number[]>();

  /**
   * Record one hit for a key. Returns false when the limit inside the window is already reached.
   */
  tryConsume(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (recent.length >= limit) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
