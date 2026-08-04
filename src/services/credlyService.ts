import { CredlyBadge, CredlyStats } from "@/types/credlyProfile";
import { extractUsername } from "./codingProfileService";

/**
 * Normalizes a Credly username/handle or full profile URL.
 * e.g. "https://www.credly.com/users/johndoe/badges" -> "johndoe"
 * e.g. "johndoe" -> "johndoe"
 */
export function extractCredlyUsername(input: string | null | undefined): string {
  if (!input) return "";
  let trimmed = input.trim();
  if (!trimmed) return "";

  // Remove trailing slashes
  trimmed = trimmed.replace(/\/+$/, "");

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      // credly.com/users/username or credly.com/users/username/badges
      if (parts.length >= 2 && parts[0] === "users") {
        return parts[1];
      }
      if (parts.length === 1) {
        return parts[0];
      }
    }
  } catch {
    // Treat as raw username
  }

  return trimmed.replace(/^@+/, "");
}

/**
 * Fetches Credly verified badges using CORS proxies.
 */
export async function fetchCredlyStats(usernameInput: string): Promise<{
  data: CredlyStats | null;
  error: string | null;
}> {
  const username = extractCredlyUsername(usernameInput);
  if (!username) {
    return { data: null, error: "Credly username or profile URL is required." };
  }

  const targetUrl = `https://www.credly.com/users/${encodeURIComponent(username)}/badges.json`;
  const timestamp = Date.now();

  const endpoints = [
    targetUrl,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
  ];

  let rawJson: any = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }

      // Check if allorigins wrap format { contents: "..." }
      if (parsed && typeof parsed.contents === "string") {
        try {
          parsed = JSON.parse(parsed.contents);
        } catch { }
      }

      if (parsed && (Array.isArray(parsed.data) || Array.isArray(parsed))) {
        rawJson = parsed;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!rawJson) {
    return {
      data: null,
      error: `Could not fetch Credly profile for "${username}". Please verify the username or profile URL.`,
    };
  }

  const badgeItems: any[] = Array.isArray(rawJson.data) ? rawJson.data : (Array.isArray(rawJson) ? rawJson : []);

  const parsedBadges: CredlyBadge[] = badgeItems.map((item: any, idx: number) => {
    const template = item.badge_template || item.template || item;
    const issuer = template.owner || template.issuer || item.issuer || {};

    const badgeName = template.name || item.name || "Verified Certification";
    const imageUrl = template.image_url || template.image?.url || item.image_url || "";
    const issuerName = issuer.name || issuer.entities?.[0]?.entity?.name || "Credly Issuer";
    const issuerLogo = issuer.image_url || issuer.image?.url || "";

    const badgeId = item.id || template.id || `credly-badge-${idx}`;
    const badgeSlug = template.vanity_slug || item.badge_template_id || badgeId;
    const badgeUrl = template.url || `https://www.credly.com/badges/${badgeSlug}`;

    return {
      id: String(badgeId),
      name: badgeName,
      image_url: imageUrl,
      issuer_name: issuerName,
      issuer_image_url: issuerLogo,
      issued_at: item.issued_at || item.created_at || undefined,
      expires_at: item.expires_at || null,
      badge_url: badgeUrl,
      description: template.description || undefined,
    };
  });

  return {
    data: {
      username,
      totalBadges: parsedBadges.length,
      badges: parsedBadges,
      last_updated: new Date().toISOString(),
    },
    error: null,
  };
}
