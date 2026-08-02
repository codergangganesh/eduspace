import {
  HuggingFaceStats,
  HuggingFaceModel,
  HuggingFaceDataset,
  HuggingFaceSpace,
  HuggingFaceCollection,
} from "@/types/huggingFaceProfile";

/**
 * Extracts clean handle/username from Hugging Face URL or input string
 */
export function extractHuggingFaceUsername(input: string): string {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?(huggingface\.co\/|hf\.co\/)/i, "");
  clean = clean.split("/")[0].split("?")[0].replace(/^@/, "");
  return clean.trim();
}

/**
 * Fetches Hugging Face user statistics, models, datasets, spaces, and collections.
 */
export async function fetchHuggingFaceStats(
  usernameInput: string
): Promise<{ data: HuggingFaceStats | null; error: string | null }> {
  const username = extractHuggingFaceUsername(usernameInput);
  if (!username) {
    return { data: null, error: "Hugging Face username is required" };
  }

  const profileUrl = `https://huggingface.co/${username}`;
  const timestamp = Date.now();

  try {
    // 1. Fetch User Overview Profile
    let overviewData: any = null;
    const overviewUrls = [
      `https://huggingface.co/api/users/${encodeURIComponent(username)}/overview?_t=${timestamp}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://huggingface.co/api/users/${encodeURIComponent(username)}/overview?_t=${timestamp}`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://huggingface.co/api/users/${encodeURIComponent(username)}/overview?_t=${timestamp}`)}`,
    ];

    for (const url of overviewUrls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json && (json.user || json.fullname || json.name || json.type || json.id || json.numModels !== undefined)) {
            overviewData = json.user || json;
            break;
          }
        }
      } catch { }
    }

    // 2. Fetch All Models for author (up to 5000 models)
    let rawModels: any[] = [];
    const modelUrls = [
      `https://huggingface.co/api/models?author=${encodeURIComponent(username)}&limit=5000&_t=${timestamp}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://huggingface.co/api/models?author=${encodeURIComponent(username)}&limit=5000&_t=${timestamp}`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://huggingface.co/api/models?author=${encodeURIComponent(username)}&limit=5000&_t=${timestamp}`)}`,
    ];
    for (const url of modelUrls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rawModels = json;
            break;
          }
        }
      } catch { }
    }

    // 3. Fetch All Datasets for author (Real-time live)
    let rawDatasets: any[] = [];
    const datasetUrls = [
      `https://huggingface.co/api/datasets?author=${encodeURIComponent(username)}&_t=${timestamp}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://huggingface.co/api/datasets?author=${encodeURIComponent(username)}&_t=${timestamp}`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://huggingface.co/api/datasets?author=${encodeURIComponent(username)}&_t=${timestamp}`)}`,
    ];
    for (const url of datasetUrls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rawDatasets = json;
            break;
          }
        }
      } catch { }
    }

    // 4. Fetch All Spaces for author (Real-time live)
    let rawSpaces: any[] = [];
    const spaceUrls = [
      `https://huggingface.co/api/spaces?author=${encodeURIComponent(username)}&_t=${timestamp}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://huggingface.co/api/spaces?author=${encodeURIComponent(username)}&_t=${timestamp}`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://huggingface.co/api/spaces?author=${encodeURIComponent(username)}&_t=${timestamp}`)}`,
    ];
    for (const url of spaceUrls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache" },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rawSpaces = json;
            break;
          }
        }
      } catch { }
    }

    // 5. Fetch Collections
    let rawCollections: any[] = [];
    try {
      const res = await fetch(`https://huggingface.co/api/collections?owner=${encodeURIComponent(username)}&_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) rawCollections = json;
      }
    } catch { }

    if (!overviewData && rawModels.length === 0 && rawDatasets.length === 0 && rawSpaces.length === 0) {
      return { data: null, error: `Hugging Face user "${username}" not found or profile is private` };
    }

    // Process Models
    let totalModelDownloads = 0;
    let totalModelLikes = 0;
    const models: HuggingFaceModel[] = rawModels.map((m: any) => {
      const downloads = typeof m.downloads === "number" ? m.downloads : 0;
      const likes = typeof m.likes === "number" ? m.likes : 0;
      totalModelDownloads += downloads;
      totalModelLikes += likes;
      return {
        id: m.id || m._id || m.modelId,
        name: (m.id || m.modelId || "").split("/")[1] || m.id || "Model",
        description: m.description || m.pipeline_tag || null,
        downloads,
        likes,
        lastModified: m.lastModified || m.updatedAt || null,
        url: `https://huggingface.co/${m.id}`,
        isPrivate: m.private || false,
        tags: Array.isArray(m.tags) ? m.tags.slice(0, 5) : [],
        pipeline_tag: m.pipeline_tag,
      };
    });

    // Process Datasets
    let totalDatasetDownloads = 0;
    let totalDatasetLikes = 0;
    const datasets: HuggingFaceDataset[] = rawDatasets.map((d: any) => {
      const downloads = typeof d.downloads === "number" ? d.downloads : 0;
      const likes = typeof d.likes === "number" ? d.likes : 0;
      totalDatasetDownloads += downloads;
      totalDatasetLikes += likes;
      return {
        id: d.id || d._id,
        name: (d.id || "").split("/")[1] || d.id || "Dataset",
        description: d.description || null,
        downloads,
        likes,
        lastModified: d.lastModified || d.updatedAt || null,
        url: `https://huggingface.co/datasets/${d.id}`,
        isPrivate: d.private || false,
        tags: Array.isArray(d.tags) ? d.tags.slice(0, 5) : [],
      };
    });

    // Process Spaces
    let totalSpaceLikes = 0;
    const spaces: HuggingFaceSpace[] = rawSpaces.map((s: any) => {
      const likes = typeof s.likes === "number" ? s.likes : 0;
      totalSpaceLikes += likes;
      return {
        id: s.id || s._id,
        name: (s.id || "").split("/")[1] || s.id || "Space",
        description: s.sdk ? `SDK: ${s.sdk}` : null,
        likes,
        lastModified: s.lastModified || s.updatedAt || null,
        url: `https://huggingface.co/spaces/${s.id}`,
        sdk: s.sdk,
        isPrivate: s.private || false,
      };
    });

    // Process Collections
    const collections: HuggingFaceCollection[] = rawCollections.map((c: any) => ({
      id: c.slug || c.id || String(Math.random()),
      title: c.title || "Collection",
      description: c.description || null,
      itemsCount: Array.isArray(c.items) ? c.items.length : 0,
      url: `https://huggingface.co/collections/${c.slug || c.id}`,
      lastModified: c.updatedAt || null,
    }));

    // Calculate exact totals from fetched arrays or overview metadata
    const totalModels = models.length > 0 ? models.length : (typeof overviewData?.numModels === "number" ? overviewData.numModels : (overviewData?.modelsCount || 0));
    const totalDatasets = datasets.length > 0 ? datasets.length : (typeof overviewData?.numDatasets === "number" ? overviewData.numDatasets : (overviewData?.datasetsCount || 0));
    const totalSpaces = spaces.length > 0 ? spaces.length : (typeof overviewData?.numSpaces === "number" ? overviewData.numSpaces : (overviewData?.spacesCount || 0));

    // Resolve avatar URL with absolute protocol & page og:image fallback
    let avatarUrl: string | null = null;
    let rawAvatar = overviewData?.avatarUrl || overviewData?.avatar || overviewData?.picture || overviewData?.avatar_url;

    if (rawAvatar) {
      if (rawAvatar.startsWith("/")) {
        if (rawAvatar.startsWith("/production/uploads/") || rawAvatar.startsWith("/uploads/")) {
          avatarUrl = `https://cdn-uploads.huggingface.co${rawAvatar}`;
        } else {
          avatarUrl = `https://huggingface.co${rawAvatar}`;
        }
      } else {
        avatarUrl = rawAvatar;
      }
    }

    if (!avatarUrl || avatarUrl.includes("user-avatar") || avatarUrl.includes("default")) {
      try {
        const htmlUrls = [
          `https://huggingface.co/${encodeURIComponent(username)}`,
          `https://corsproxy.io/?url=${encodeURIComponent(`https://huggingface.co/${encodeURIComponent(username)}`)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://huggingface.co/${encodeURIComponent(username)}`)}`,
        ];
        for (const pageUrl of htmlUrls) {
          try {
            const pageRes = await fetch(pageUrl, { cache: "no-store", signal: AbortSignal.timeout(4000) });
            if (pageRes.ok) {
              const html = await pageRes.text();
              const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                              html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                              html.match(/src=["'](https:\/\/[^"']*(?:cdn-uploads\.huggingface\.co|avatars)[^"']*)["']/i);
              if (ogMatch && ogMatch[1] && !ogMatch[1].includes("huggingface-logo") && !ogMatch[1].includes("hf-logo")) {
                avatarUrl = ogMatch[1];
                break;
              }
            }
          } catch { }
        }
      } catch { }
    }

    if (!avatarUrl) {
      avatarUrl = `https://huggingface.co/avatars/${username}.png`;
    }

    // Sort by likes & downloads for featured
    const featuredModels = [...models].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes)).slice(0, 3);
    const featuredDatasets = [...datasets].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes)).slice(0, 3);
    const featuredSpaces = [...spaces].sort((a, b) => b.likes - a.likes).slice(0, 3);

    // Sort by last modified for recent / all models
    const recentModels = [...models].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes));
    const recentDatasets = [...datasets].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes));
    const recentSpaces = [...spaces].sort((a, b) => b.likes - a.likes);

    const stats: HuggingFaceStats = {
      username,
      fullname: overviewData?.fullname || overviewData?.name || username,
      avatarUrl,
      bio: overviewData?.bio || overviewData?.description || null,
      organization: overviewData?.orgs?.[0]?.name || overviewData?.organization || null,
      websiteUrl: overviewData?.websiteUrl || overviewData?.homepage || null,
      location: overviewData?.location || null,
      followers: overviewData?.numFollowers || overviewData?.followersCount || 0,
      following: overviewData?.numFollowing || overviewData?.followingCount || 0,
      joinedDate: overviewData?.createdAt || overviewData?.joinedAt || null,
      profileUrl,

      totalModels,
      totalModelDownloads,
      totalModelLikes,
      featuredModels,
      recentModels,

      totalDatasets,
      totalDatasetDownloads,
      totalDatasetLikes,
      featuredDatasets,
      recentDatasets,

      totalSpaces,
      totalSpaceLikes,
      featuredSpaces,
      recentSpaces,

      totalCollections: collections.length,
      collections,

      totalDownloads: totalModelDownloads + totalDatasetDownloads,
      totalLikes: totalModelLikes + totalDatasetLikes + totalSpaceLikes,

      last_updated: new Date().toISOString(),
    };

    return { data: stats, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || "Failed to fetch Hugging Face statistics" };
  }
}
