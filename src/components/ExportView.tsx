"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ConversationData, Message, Role } from "@/lib/parse";
import type { MediaMeta } from "@/lib/media";

export type ExportViewHandle = {
  exportAll: () => Promise<void>;
};

type PageHandle = { thumb: HTMLDivElement; page: HTMLDivElement; chat: HTMLDivElement; foot: HTMLDivElement };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function buildMediaNode(
  media: NonNullable<Message["media"]>,
  mediaMap: Map<string, MediaMeta>,
  maxW: number,
  maxH: number
) {
  if (media.type === "image") {
    const meta = mediaMap.get(media.filename.toLowerCase());
    const img = document.createElement("img");
    img.className = "bubble-img";
    img.alt = media.filename;
    if (meta && meta.w && meta.h) {
      img.src = meta.url;
      const scale = Math.min(1, maxW / meta.w, maxH / meta.h);
      img.style.width = Math.round(meta.w * scale) + "px";
      img.style.height = Math.round(meta.h * scale) + "px";
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

function makeRow(msg: Message, role: Role, grouped: boolean, mediaMap: Map<string, MediaMeta>) {
  const row = el("div", "row" + (msg.who === "me" ? " me" : "") + (grouped ? " grouped" : ""));
  row.appendChild(el("div", "avatar", role.avatar));
  const box = el("div", "msg");
  if (!grouped) box.appendChild(el("div", "name", role.name));
  const bubble = el("div", "bubble" + (msg.media ? " has-img" : ""));
  if (msg.media) bubble.appendChild(buildMediaNode(msg.media, mediaMap, 560, 480));
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
  foot.append(el("span", "", "blabla"), el("span", "num", ""));
  page.append(head, chat, foot);
  thumb.appendChild(page);
  return { thumb, page, chat, foot };
}

function safeName(s: string) {
  return (s || "blabla").replace(/[\\/:*?"<>|]/g, "").trim() || "blabla";
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
    data: ConversationData;
    mediaMap: Map<string, MediaMeta>;
    onStatus: (s: string) => void;
  }
>(function ExportView({ data, mediaMap, onStatus }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<PageHandle[]>([]);

  useEffect(() => {
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
      let row = makeRow(msg, data.roles[msg.who], grouped, mediaMap);
      p.chat.appendChild(row);
      if (p.chat.scrollHeight > p.chat.clientHeight + 1 && p.chat.children.length > 1) {
        p.chat.removeChild(row);
        p = makePage(data.title, false);
        pagesRef.current.push(p);
        container.appendChild(p.thumb);
        row = makeRow(msg, data.roles[msg.who], false, mediaMap);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mediaMap]);

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
