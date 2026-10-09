"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ConversationData, Message, Role } from "@/lib/parse";
import { loadImageDims, mediaUrl } from "@/lib/media";
import { ME_AVATAR_SRC } from "@/lib/me";

export type ExportViewHandle = {
  exportAll: () => Promise<void>;
};

type PageHandle = { thumb: HTMLDivElement; page: HTMLDivElement; chat: HTMLDivElement; foot: HTMLDivElement };
type ImageDims = Map<string, { w: number; h: number } | null>;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function buildMediaNode(
  folder: string,
  media: NonNullable<Message["media"]>,
  dims: ImageDims,
  maxW: number,
  maxH: number
) {
  if (media.type === "image") {
    const d = dims.get(media.filename);
    const img = document.createElement("img");
    img.className = "bubble-img";
    img.alt = media.filename;
    if (d) {
      img.src = mediaUrl(folder, media.filename);
      const scale = Math.min(1, maxW / d.w, maxH / d.h);
      img.style.width = Math.round(d.w * scale) + "px";
      img.style.height = Math.round(d.h * scale) + "px";
    } else {
      img.style.width = maxW + "px";
      img.style.height = Math.round(maxH * 0.6) + "px";
      img.style.background = "#E7E7E7";
    }
    return img;
  }
  // a still PNG export can't carry motion or sound — show a static card instead
  const box = el("div", "media-static");
  const h = media.type === "video" ? Math.round(maxH * 0.55) : 140;
  box.style.width = maxW + "px";
  box.style.height = h + "px";
  box.append(
    el("div", "media-static-icon", media.type === "video" ? "▶" : "♪"),
    el("div", "media-static-label", media.filename)
  );
  return box;
}

function makeRow(folder: string, msg: Message, role: Role, grouped: boolean, dims: ImageDims) {
  const row = el("div", "row" + (msg.who === "me" ? " me" : "") + (grouped ? " grouped" : ""));
  const avatar = el("div", "avatar");
  if (msg.who === "me") {
    const img = el("img", "avatar-img");
    img.src = ME_AVATAR_SRC;
    img.alt = role.name;
    avatar.appendChild(img);
  } else {
    avatar.textContent = role.avatar;
  }
  row.appendChild(avatar);
  const box = el("div", "msg");
  if (!grouped) box.appendChild(el("div", "name", role.name));
  const bubble = el("div", "bubble" + (msg.media ? " has-img" : ""));
  if (msg.media) bubble.appendChild(buildMediaNode(folder, msg.media, dims, 560, 480));
  if (msg.text) bubble.appendChild(el("div", "bubble-text", msg.text));
  box.appendChild(bubble);
  row.appendChild(box);
  return row;
}

function makePage(title: string, isFirst: boolean): PageHandle {
  const thumb = el("div", "thumb");
  const page = el("div", "page" + (isFirst ? "" : " cont"));
  const head = el("div", "page-head");
  head.appendChild(el("h2", "page-title", title || "无题"));
  const chat = el("div", "chat");
  const foot = el("div", "page-foot");
  foot.append(el("span", "", "Moonchat"), el("span", "num", ""));
  page.append(head, chat, foot);
  thumb.appendChild(page);
  return { thumb, page, chat, foot };
}

function safeName(s: string) {
  return (s || "Moonchat").replace(/[\\/:*?"<>|]/g, "").trim() || "Moonchat";
}

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const ExportView = forwardRef<
  ExportViewHandle,
  {
    folder: string;
    data: ConversationData;
    onStatus: (s: string) => void;
  }
>(function ExportView({ folder, data, onStatus }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<PageHandle[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const imageFilenames = Array.from(
        new Set(
          data.messages
            .filter((m): m is Message & { media: NonNullable<Message["media"]> } => m.media?.type === "image")
            .map((m) => m.media.filename)
        )
      );
      const dims: ImageDims = new Map();
      await Promise.all(
        imageFilenames.map(async (fn) => {
          dims.set(fn, await loadImageDims(folder, fn));
        })
      );
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";
      pagesRef.current = [];
      if (!data.messages.length) {
        container.appendChild(el("p", "export-empty", "这个联系人还没有任何一篇对话"));
        return;
      }
      let p = makePage(data.title, true);
      pagesRef.current.push(p);
      container.appendChild(p.thumb);
      data.messages.forEach((msg, i) => {
        const grouped = i > 0 && data.messages[i - 1].who === msg.who && p.chat.children.length > 0;
        let row = makeRow(folder, msg, data.roles[msg.who], grouped, dims);
        p.chat.appendChild(row);
        if (p.chat.scrollHeight > p.chat.clientHeight + 1 && p.chat.children.length > 1) {
          p.chat.removeChild(row);
          p = makePage(data.title, false);
          pagesRef.current.push(p);
          container.appendChild(p.thumb);
          row = makeRow(folder, msg, data.roles[msg.who], false, dims);
          p.chat.appendChild(row);
        }
      });
      const pages = pagesRef.current;
      pages.forEach((pg, i) => {
        pg.foot.querySelector(".num")!.textContent = pages.length > 1 ? `${i + 1} / ${pages.length}` : "";
        pg.thumb.tabIndex = 0;
        pg.thumb.setAttribute("role", "button");
        pg.thumb.setAttribute("aria-label", `导出第 ${i + 1} 页`);
        pg.thumb.onclick = () => doExport([i]);
        pg.thumb.onkeydown = (e) => {
          if (e.key === "Enter") doExport([i]);
        };
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, folder]);

  async function doExport(indexes: number[]) {
    const htmlToImage = await import("html-to-image");
    try {
      for (let n = 0; n < indexes.length; n++) {
        const i = indexes[n];
        onStatus(`正在导出 ${n + 1} / ${indexes.length}…`);
        const url = await htmlToImage.toPng(pagesRef.current[i].page, {
          width: 1080,
          height: 1440,
          pixelRatio: 1,
          style: { transform: "none" },
        });
        download(url, `${safeName(data.title)}-${String(i + 1).padStart(2, "0")}.png`);
        await new Promise((r) => setTimeout(r, 300));
      }
      onStatus(`已导出 ${indexes.length} 张图片`);
    } catch (err) {
      console.error(err);
      onStatus("导出失败：" + (err instanceof Error ? err.message : String(err)));
    }
  }

  useImperativeHandle(ref, () => ({
    exportAll: () => doExport(pagesRef.current.map((_, i) => i)),
  }));

  return <div className="pages" ref={containerRef} />;
});
