const registeredCacheClearers = new Set<() => void>();

export function createRegisteredMap<K, V>() {
    const cache = new Map<K, V>();
    registeredCacheClearers.add(() => cache.clear());
    return cache;
}

export function clearRegisteredCaches() {
    registeredCacheClearers.forEach((clearCache) => clearCache());
}
