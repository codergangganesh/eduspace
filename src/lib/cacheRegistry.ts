const registeredCacheClearers = new Set<() => void>();

export function createRegisteredMap<K, V>(maxCapacity = 50, ttlMs = 5 * 60 * 1000): Map<K, V> {
    const cache = new Map<K, V>();
    const timestampMap = new Map<K, number>();

    const originalGet = cache.get.bind(cache);
    const originalSet = cache.set.bind(cache);
    const originalHas = cache.has.bind(cache);
    const originalDelete = cache.delete.bind(cache);
    const originalClear = cache.clear.bind(cache);

    cache.get = (key: K) => {
        if (!originalHas(key)) return undefined;
        const ts = timestampMap.get(key) || 0;
        if (Date.now() - ts > ttlMs) {
            cache.delete(key);
            return undefined;
        }
        // Refresh LRU order
        const value = originalGet(key)!;
        originalDelete(key);
        timestampMap.delete(key);
        originalSet(key, value);
        timestampMap.set(key, Date.now());
        return value;
    };

    cache.has = (key: K) => {
        if (!originalHas(key)) return false;
        const ts = timestampMap.get(key) || 0;
        if (Date.now() - ts > ttlMs) {
            cache.delete(key);
            return false;
        }
        return true;
    };

    cache.set = (key: K, value: V) => {
        if (originalHas(key)) {
            originalDelete(key);
            timestampMap.delete(key);
        } else if (cache.size >= maxCapacity) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                originalDelete(firstKey);
                timestampMap.delete(firstKey);
            }
        }
        originalSet(key, value);
        timestampMap.set(key, Date.now());
        return cache;
    };

    cache.delete = (key: K) => {
        timestampMap.delete(key);
        return originalDelete(key);
    };

    cache.clear = () => {
        timestampMap.clear();
        originalClear();
    };

    registeredCacheClearers.add(() => cache.clear());
    return cache;
}

export function clearRegisteredCaches() {
    registeredCacheClearers.forEach((clearCache) => clearCache());
}
