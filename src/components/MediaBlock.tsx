"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/media";
import type { Message } from "@/lib/parse";

export function MediaBlock({ folder, media }: { folder: string; media: NonNullable<Message["media"]> }) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(folder, media.filename);

  if (failed) {
    const icon = media.type === "image" ? "🖼" : media.type === "video" ? "🎬" : "🎵";
    return (
      <div className="flex flex-col items-center justify-center gap-1 bg-[#E7E7E7] text-[#8a8a8a] text-xs text-center p-3 w-[220px] h-[140px]">
        <span>
          {icon} {media.filename}
        </span>
        <span>未找到，请放进 conversations/{folder}/</span>
      </div>
    );
  }

  if (media.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={media.filename}
        onError={() => setFailed(true)}
        className="block max-w-full max-h-[280px] object-cover"
      />
    );
  }

  if (media.type === "video") {
    return (
      <video
        src={url}
        controls
        onError={() => setFailed(true)}
        className="block max-w-full"
        style={{ maxHeight: 320 }}
      />
    );
  }

  return <audio src={url} controls onError={() => setFailed(true)} className="block w-[260px]" />;
}
