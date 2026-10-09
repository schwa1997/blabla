"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactAvatar } from "@/components/ContactAvatar";
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
  return (
    <aside className="flex flex-col bg-white border-r border-[#E9EDEF] min-h-0">
      <h1 className="text-[19px] font-semibold text-white bg-[#008069] px-4 py-4 m-0">blabla</h1>

      <div className="px-3 pt-3">
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索标题 / 话题 / 内容 / 日期"
          className="bg-[#F0F2F5] border-none"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <nav className="flex flex-col">
          {items.length === 0 && <p className="text-[#667781] text-sm px-4 py-4">没有找到匹配的对话</p>}
          {items.map((item) => {
            const active = item.id === activeItemId;
            const primary = item.isGroup ? item.title || item.otherNames.join("、") : item.partnerName || item.title;
            const secondary = item.isGroup
              ? item.otherNames.join("、")
              : [item.type, item.topic || item.title].filter(Boolean).join(" · ");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item)}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-3 border-b border-[#E9EDEF] transition-colors ${
                  active ? "bg-[#F0F2F5]" : "hover:bg-[#F5F6F6]"
                }`}
              >
                <ContactAvatar item={item} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[15px] text-[#111B21] truncate">{primary || "未知"}</span>
                    {item.date && <span className="text-[11px] text-[#667781] flex-none">{item.date}</span>}
                  </div>
                  <div className="text-[13px] text-[#667781] truncate mt-0.5">{secondary}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {status && (
        <p className="text-xs text-[#667781] px-4 py-2 min-h-[1.4em] m-0 border-t border-[#E9EDEF]">{status}</p>
      )}
    </aside>
  );
}
