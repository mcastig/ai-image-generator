export interface User {
  id: string;
  githubId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Image {
  id: string;
  userId: string | null;
  prompt: string;
  negativePrompt: string | null;
  color: string | null;
  resolution: string;
  guidance: number;
  imageUrl: string;
  seed: number | null;
  createdAt: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  isSaved?: boolean;
  // DB snake_case aliases
  image_url?: string;
  negative_prompt?: string | null;
  created_at?: string;
  author_name?: string | null;
  author_avatar?: string | null;
  is_saved?: boolean;
  user_id?: string | null;
}

export type TabId = "generate" | "feed" | "history" | "collection";

export type Resolution = {
  label: string;
  value: string;
  dalleSize: "1024x1024" | "1792x1024" | "1024x1792";
};

export const RESOLUTIONS: Resolution[] = [
  { label: "1024 × 1024 (1:1)", value: "1024x1024", dalleSize: "1024x1024" },
  { label: "1152 × 896 (9:7)", value: "1152x896", dalleSize: "1792x1024" },
  { label: "896 × 1152 (7:9)", value: "896x1152", dalleSize: "1024x1792" },
  { label: "1344 × 768 (7:4)", value: "1344x768", dalleSize: "1792x1024" },
  { label: "768 × 1344 (4:7)", value: "768x1344", dalleSize: "1024x1792" },
];

export const COLOR_OPTIONS = [
  { label: "Red", value: "#DD524C" },
  { label: "Orange", value: "#E87B35" },
  { label: "Green", value: "#5EC269" },
  { label: "Blue", value: "#4E80EE" },
  { label: "Purple", value: "#9D59EF" },
  { label: "White", value: "#E4E4E7" },
];
