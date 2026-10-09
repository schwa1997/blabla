export type MediaKind = "image" | "video" | "audio";

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
const AUDIO_RE = /\.(mp3|wav|m4a|ogg|aac)$/i;

export function mediaKind(filename: string): MediaKind | null {
  if (IMAGE_RE.test(filename)) return "image";
  if (VIDEO_RE.test(filename)) return "video";
  if (AUDIO_RE.test(filename)) return "audio";
  return null;
}

/** Media referenced from a conversation lives alongside its .txt, in conversations/<folder>/. */
export function mediaUrl(folder: string, filename: string): string {
  return `/api/conversations/media/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

const dimCache = new Map<string, Promise<{ w: number; h: number } | null>>();

/** Preloads an image to learn its pixel size (needed to lay out the export pages before painting). */
export function loadImageDims(folder: string, filename: string): Promise<{ w: number; h: number } | null> {
  const key = `${folder}/${filename}`;
  let cached = dimCache.get(key);
  if (!cached) {
    cached = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = mediaUrl(folder, filename);
    });
    dimCache.set(key, cached);
  }
  return cached;
}
