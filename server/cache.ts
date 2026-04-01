const cache = new Map<string, { data: any; expires: number }>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): () => Promise<T> {
  return async () => {
    const entry = cache.get(key);
    if (entry && entry.expires > Date.now()) return entry.data as T;
    const data = await fn();
    cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  };
}

export function invalidate(key: string) {
  cache.delete(key);
}

export function invalidateAll() {
  cache.clear();
}
