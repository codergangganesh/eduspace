export interface HuggingFaceModel {
  id: string;
  name: string;
  description?: string;
  downloads: number;
  likes: number;
  lastModified?: string;
  url: string;
  isPrivate?: boolean;
  tags?: string[];
  pipeline_tag?: string;
}

export interface HuggingFaceDataset {
  id: string;
  name: string;
  description?: string;
  downloads: number;
  likes: number;
  lastModified?: string;
  url: string;
  isPrivate?: boolean;
  tags?: string[];
}

export interface HuggingFaceSpace {
  id: string;
  name: string;
  description?: string;
  likes: number;
  lastModified?: string;
  url: string;
  sdk?: string;
  isPrivate?: boolean;
}

export interface HuggingFaceCollection {
  id: string;
  title: string;
  description?: string;
  itemsCount: number;
  url: string;
  lastModified?: string;
}

export interface HuggingFaceStats {
  username: string;
  fullname?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  organization?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  followers?: number;
  following?: number;
  joinedDate?: string | null;
  profileUrl: string;

  // Models
  totalModels: number;
  totalModelDownloads: number;
  totalModelLikes: number;
  featuredModels?: HuggingFaceModel[];
  recentModels?: HuggingFaceModel[];

  // Datasets
  totalDatasets: number;
  totalDatasetDownloads: number;
  totalDatasetLikes: number;
  featuredDatasets?: HuggingFaceDataset[];
  recentDatasets?: HuggingFaceDataset[];

  // Spaces
  totalSpaces: number;
  totalSpaceLikes: number;
  featuredSpaces?: HuggingFaceSpace[];
  recentSpaces?: HuggingFaceSpace[];

  // Collections
  totalCollections: number;
  collections?: HuggingFaceCollection[];

  // Statistics Aggregates
  totalDownloads: number;
  totalLikes: number;

  last_updated?: string;
}
