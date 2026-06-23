/*
  Upstash Redis 封装（FR-140 计数 + NFR-006 限流）。
  - prod：@upstash/redis（按 UPSTASH_REDIS_REST_URL/_TOKEN 懒建）。
  - test/local：内存 mock（计数/限流接口一致），无 PII（INV-09）。
  接口最小：incr / get / 令牌桶 rateLimit。计数 key 为聚合量（如 stat:exchanges_total），无个体键。
*/

export interface RedisLike {
  incr(key: string): Promise<number>;
  get(key: string): Promise<number | null>;
  /** 令牌桶限流：返回是否放行 + 剩余。窗口内超 limit 则拒绝（NFR-006）。 */
  rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }>;
}

/** 内存实现（测试/本地）：计数 + 朴素固定窗口限流。 */
export class MemoryRedis implements RedisLike {
  private store = new Map<string, number>();
  private windows = new Map<string, { count: number; resetAt: number }>();

  async incr(key: string): Promise<number> {
    const next = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, next);
    return next;
  }

  async get(key: string): Promise<number | null> {
    return this.store.get(key) ?? null;
  }

  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const win = this.windows.get(key);
    if (!win || win.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1 };
    }
    if (win.count >= limit) return { allowed: false, remaining: 0 };
    win.count += 1;
    return { allowed: true, remaining: limit - win.count };
  }

  /** 测试辅助：重置。 */
  reset(): void {
    this.store.clear();
    this.windows.clear();
  }
}

/** Upstash 实现（prod）。固定窗口限流用 INCR + EXPIRE。 */
class UpstashRedis implements RedisLike {
  // 用 any 避免对 @upstash 具体类型的硬依赖（懒加载）。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private client: any) {}

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async get(key: string): Promise<number | null> {
    const v = await this.client.get(key);
    return v == null ? null : Number(v);
  }

  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const count: number = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, windowSeconds);
    const remaining = Math.max(0, limit - count);
    return { allowed: count <= limit, remaining };
  }
}

let cached: RedisLike | null = null;

/** 测试注入内存 redis。 */
export function setRedis(redis: RedisLike): void {
  cached = redis;
}

/** 测试清理。 */
export function resetRedis(): void {
  cached = null;
}

/** 懒获取 redis 句柄：有 Upstash env 用 Upstash，否则内存兜底（本地/测试）。 */
export async function getRedis(): Promise<RedisLike> {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const { Redis } = await import("@upstash/redis");
    cached = new UpstashRedis(new Redis({ url, token }));
  } else {
    cached = new MemoryRedis();
  }
  return cached;
}
