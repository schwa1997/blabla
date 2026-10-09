"use client";

import type { CSSProperties } from "react";
import type { MediaMeta } from "@/lib/media";
import type { Message } from "@/lib/parse";

export function MediaBlock({
  media,
  mediaMap,
  maxW,
  maxH,
}: {
  media: NonNullable<Message["media"]>;
  mediaMap: Map<string, MediaMeta>;
  maxW?: number;
  maxH?: number;
}) {
  const meta = mediaMap.get(media.filename.toLowerCase());

  if (!meta) {
    const w = maxW ? Math.round(maxW * 0.5) : 220;
    const h = maxH ? Math.round(maxH * 0.5) : 140;
    return (
      <div
        className="flex items-center justify-center bg-[#E7E7E7] text-[#8a8a8a] text-xs text-center p-2"
        style={{ width: w, height: h }}
      >
        {media.type === "image" ? "🖼" : media.type === "video" ? "🎬" : "🎵"} {media.filename}
        <br />
        未找到，请先用“打开文件夹”一起打开
      </div>
    );
  }

  if (meta.kind === "image") {
    let style: CSSProperties = { display: "block", maxWidth: "100%", maxHeight: 280, objectFit: "cover" };
    if (maxW && maxH && meta.w && meta.h) {
      const scale = Math.min(1, maxW / meta.w, maxH / meta.h);
      style = { display: "block", width: Math.round(meta.w * scale), height: Math.round(meta.h * scale) };
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={meta.url} alt={media.filename} style={style} />;
  }

  if (meta.kind === "video") {
    return (
      <video
        src={meta.url}
        controls
        style={{ display: "block", maxWidth: maxW ?? 320, maxHeight: maxH ?? 320, width: "100%" }}
      />
    );
  }

  return (
    <audio
      src={meta.url}
      controls
      className="block"
      style={{ width: maxW ?? 260 }}
    />
  );
}
