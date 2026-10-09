export type MediaMeta = {
  url: string;
  kind: "image" | "video" | "audio";
  w?: number;
  h?: number;
};

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;
const AUDIO_RE = /\.(mp3|wav|m4a|ogg|aac)$/i;

export function isMediaFile(name: string) {
  return IMAGE_RE.test(name) || VIDEO_RE.test(name) || AUDIO_RE.test(name);
}

export function revokeMediaMap(map: Map<string, MediaMeta>) {
  map.forEach((m) => {
    try {
      URL.revokeObjectURL(m.url);
    } catch {
      // ignore
    }
  });
}

/** Loads every image/video/audio file in a folder selection into a filename -> MediaMeta map. */
export async function buildMediaMap(files: File[]): Promise<Map<string, MediaMeta>> {
  const map = new Map<string, MediaMeta>();
  await Promise.all(
    files.map(
      (f) =>
        new Promise<void>((resolve) => {
          const name = f.name.toLowerCase();
          if (IMAGE_RE.test(name)) {
            const url = URL.createObjectURL(f);
            const img = new Image();
            img.onload = () => {
              map.set(name, { url, kind: "image", w: img.naturalWidth, h: img.naturalHeight });
              resolve();
            };
            img.onerror = () => {
              map.set(name, { url, kind: "image", w: 400, h: 300 });
              resolve();
            };
            img.src = url;
          } else if (VIDEO_RE.test(name)) {
            map.set(name, { url: URL.createObjectURL(f), kind: "video" });
            resolve();
          } else if (AUDIO_RE.test(name)) {
            map.set(name, { url: URL.createObjectURL(f), kind: "audio" });
            resolve();
          } else {
            resolve();
          }
        })
    )
  );
  return map;
}
