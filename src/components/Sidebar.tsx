"use client";

import { useEffect, useRef, useState } from "react";
import { MoonStar, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactAvatar } from "@/components/ContactAvatar";
import { Highlight } from "@/components/Highlight";
import { ThemeToggle } from "@/components/ThemeToggle";
import { findSnippet } from "@/lib/search";
import { ME_AVATAR_SRC } from "@/lib/me";
import type { LibraryItem } from "@/lib/library";

export function Sidebar({
  items,
  query,
  onQueryChange,
  activeItemId,
  onSelectItem,
  status,
}: {
  items: LibraryItem[];
  query: string;
  onQueryChange: (q: string) => void;
  activeItemId: string | null;
  onSelectItem: (item: LibraryItem) => void;
  status: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  // keyboard cursor within the filtered list while the search box is focused
  const [cursor, setCursor] = useState(0);
  // search sits behind an icon; it stays open while it holds a query
  const [searchOpen, setSearchOpen] = useState(false);
  const searchShown = searchOpen || query.length > 0;
  const searching = query.trim().length > 0;

  function changeQuery(q: string) {
    onQueryChange(q);
    setCursor(0);
  }

  function closeSearch() {
    changeQuery("");
    setSearchOpen(false);
  }

  // ⌘K / Ctrl+K or "/" opens search from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function moveCursor(next: number) {
    if (!items.length) return;
    const i = (next + items.length) % items.length;
    setCursor(i);
    itemRefs.current.get(items[i].id)?.scrollIntoView({ block: "nearest" });
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveCursor(cursor + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveCursor(cursor - 1);
    } else if (e.key === "Enter" && items[cursor]) {
      e.preventDefault();
      onSelectItem(items[cursor]);
    } else if (e.key === "Escape") {
      if (query) changeQuery("");
      else closeSearch();
    }
  }

  return (
    <aside className="flex flex-col min-h-0 bg-side text-starlight bg-[radial-gradient(ellipse_280px_200px_at_85%_-40px,rgb(232_199_122/0.16),transparent_70%)]">
      <header className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ME_AVATAR_SRC}
          alt="我的头像"
          className="size-10 flex-none rounded-full object-cover ring-2 ring-moon/50 shadow-[0_0_18px_rgb(232_199_122/0.25)]"
        />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 text-lg font-semibold tracking-wide m-0 leading-tight">
            Moonchat
            <MoonStar className="size-4 text-moon" />
          </h1>
          <p className="text-[11px] text-starlight-soft m-0 truncate">继续没说完的对话</p>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (searchShown ? closeSearch() : setSearchOpen(true))}
          aria-label={searchShown ? "关闭搜索" : "搜索对话 (⌘K)"}
          aria-expanded={searchShown}
          title="搜索 (⌘K)"
          className={`grid place-items-center size-8 rounded-full transition-colors ${
            searchShown ? "text-moon bg-side-raised" : "text-starlight-soft hover:text-moon hover:bg-side-raised"
          }`}
        >
          <Search className="size-4" />
        </button>
        <ThemeToggle />
      </header>

      {searchShown && (
        <div className="px-3 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="group flex items-center gap-2 h-9 px-3 rounded-full bg-side-raised/70 ring-1 ring-side-line focus-within:ring-moon/60 transition-shadow">
            <Search className="size-4 flex-none text-starlight-soft group-focus-within:text-moon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              onKeyDown={onSearchKey}
              onBlur={() => !query && setSearchOpen(false)}
              autoFocus
              placeholder="搜索标题 / 话题 / 内容 / 日期"
              aria-label="搜索对话"
              className="flex-1 min-w-0 bg-transparent text-sm text-starlight placeholder:text-starlight-soft/70 outline-none"
            />
            {query ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => changeQuery("")}
                aria-label="清除搜索"
                className="grid place-items-center size-5 rounded-full text-starlight-soft hover:text-starlight hover:bg-white/10"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="text-[10px] text-starlight-soft/80 border border-side-line rounded px-1.5 py-0.5 font-sans">
                esc
              </kbd>
            )}
          </label>
          {searching && (
            <p className="text-[11px] text-starlight-soft mt-2 mb-0 px-1">
              {items.length ? `找到 ${items.length} 篇 · ↑↓ 选择 · Enter 打开` : ""}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <nav className="flex flex-col px-2 pb-2 gap-0.5">
          {items.length === 0 && (
            <p className="text-starlight-soft text-sm px-3 py-6 text-center">没有找到「{query.trim()}」相关的对话</p>
          )}
          {items.map((item, i) => {
            const active = item.id === activeItemId;
            const focused = searching && i === cursor;
            const primary = item.isGroup ? item.title || item.otherNames.join("、") : item.partnerName || item.title;
            const secondary = item.isGroup
              ? item.otherNames.join("、")
              : [item.type, item.topic || item.title].filter(Boolean).join(" · ");
            const snippet = searching ? findSnippet(item.text, query) : null;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.id, el);
                  else itemRefs.current.delete(item.id);
                }}
                type="button"
                onClick={() => onSelectItem(item)}
                onMouseEnter={() => searching && setCursor(i)}
                className={`relative flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                  active ? "bg-side-raised" : focused ? "bg-side-raised/60" : "hover:bg-side-raised/50"
                }`}
              >
                {active && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-moon" />}
                <ContactAvatar item={item} size={44} ringClass="ring-side" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[15px] truncate">
                      <Highlight text={primary || "未知"} query={query} />
                    </span>
                    {item.date && <span className="text-[11px] text-starlight-soft flex-none">{item.date}</span>}
                  </div>
                  <div className="text-[13px] text-starlight-soft truncate mt-0.5">
                    <Highlight text={snippet ?? secondary} query={query} />
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {status && (
        <p className="text-xs text-starlight-soft px-4 py-2 min-h-[1.4em] m-0 border-t border-side-line">{status}</p>
      )}
    </aside>
  );
}
