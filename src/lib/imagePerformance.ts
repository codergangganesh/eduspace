import { getOptimizedImageUrl } from "@/utils/cloudinaryUpload";

export const PROFILE_IDENTITY_CACHE_KEY = "eduspace-profile-identity-cache";

export const SHELL_IMAGE_ASSETS = [
  "/favicon.png",
  "/dashboard-icon.png",
  "/feed-icon.png",
  "/schedule-icon.png",
  "/assignment-icon.png",
  "/quiz-icon.png",
  "/edumatrix-icon.png",
  "/ai-icon.png",
  "/ai-tutor.png",
  "/streak-icon.png",
  "/attendance-icon.png",
  "/messages-icon.png",
  "/students-icon.png",
  "/timetable-icon.png",
  "/ai-quiz-gen-icon.png",
] as const;

type CachedImageStatus = "loaded" | "error";

type CachedProfileIdentity = {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  email: string | null;
  updatedAt: string;
};

const imageStatusCache = new Map<string, CachedImageStatus>();
const inFlightImageRequests = new Map<string, Promise<string>>();

export const getOptimizedAssetUrl = (url?: string | null) => {
  if (!url) return "";
  return getOptimizedImageUrl(url, { quality: 80, format: "auto" });
};

export const isImageCached = (url?: string | null) => {
  if (!url) return false;
  return imageStatusCache.get(getOptimizedAssetUrl(url)) === "loaded";
};

export const preloadImage = (url?: string | null, fetchPriority: "high" | "low" | "auto" = "high") => {
  const optimizedUrl = getOptimizedAssetUrl(url);
  if (!optimizedUrl) {
    return Promise.resolve("");
  }

  if (imageStatusCache.get(optimizedUrl) === "loaded") {
    return Promise.resolve(optimizedUrl);
  }

  const existingRequest = inFlightImageRequests.get(optimizedUrl);
  if (existingRequest) {
    return existingRequest;
  }

  const request = new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    try {
      image.fetchPriority = fetchPriority;
    } catch {}

    image.onload = () => {
      imageStatusCache.set(optimizedUrl, "loaded");
      inFlightImageRequests.delete(optimizedUrl);
      resolve(optimizedUrl);
    };

    image.onerror = () => {
      imageStatusCache.set(optimizedUrl, "error");
      inFlightImageRequests.delete(optimizedUrl);
      reject(new Error(`Failed to preload image: ${optimizedUrl}`));
    };

    image.src = optimizedUrl;
  }).catch(() => optimizedUrl);

  inFlightImageRequests.set(optimizedUrl, request);
  return request;
};

export const preloadImages = (urls: Array<string | null | undefined>, fetchPriority: "high" | "low" | "auto" = "high") =>
  Promise.allSettled(
    urls
      .filter((url): url is string => Boolean(url))
      .map((url) => preloadImage(url, fetchPriority))
  );

export const warmShellImages = () => preloadImages([...SHELL_IMAGE_ASSETS], "high");

export const readCachedProfileIdentity = (userId?: string | null): CachedProfileIdentity | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROFILE_IDENTITY_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedProfileIdentity;
    if (!parsed?.userId) return null;
    if (userId && parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedProfileIdentity = (identity: CachedProfileIdentity) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PROFILE_IDENTITY_CACHE_KEY, JSON.stringify(identity));
  } catch {}
};

export const clearCachedProfileIdentity = () => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROFILE_IDENTITY_CACHE_KEY);
  } catch {}
};
