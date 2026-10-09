"use client";

import { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PartnerGroup } from "@/lib/library";

type FileInputElement = HTMLInputElement & { webkitdirectory?: boolean };

export function Sidebar({
  groups,
  query,
  onQueryChange,
  activePartnerId,
  onSelectPartner,
  onOpenFolder,
  status,
}: {
  groups: PartnerGroup[];
  query: string;
  onQueryChange: (q: string) => void;
  activePartnerId: string | null;
  onSelectPartner: (group: PartnerGroup) => void;
  onOpenFolder: (files: FileList) => void;
  status: string;
}) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length) onOpenFolder(e.target.files);
    e.target.value = "";
  }

  return (
    <aside className="flex flex-col bg-white border-r border-[#E9EDEF] min-h-0">
      <h1 className="text-[19px] font-semibold text-white bg-[#008069] px-4 py-4 m-0">blabla</h1>

      <div className="px-3 pt-3">
        <label className={buttonVariants({ variant: "outline", className: "w-full cursor-pointer" })}>
          打开文件夹
          <input
            type="file"
            className="hidden"
            ref={(node) => {
              if (node) (node as FileInputElement).webkitdirectory = true;
            }}
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="px-3 py-2">
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
          {groups.length === 0 && (
            <p className="text-[#667781] text-sm px-4 py-4">没有找到匹配的对话</p>
          )}
          {groups.map((g) => {
            const last = g.items[g.items.length - 1];
            const active = g.id === activePartnerId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectPartner(g)}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-3 border-b border-[#E9EDEF] transition-colors ${
                  active ? "bg-[#F0F2F5]" : "hover:bg-[#F5F6F6]"
                }`}
              >
                <Avatar className="size-[46px] bg-[#DFE5E7]">
                  <AvatarFallback className="bg-transparent text-xl">{g.avatar || "💬"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[15px] text-[#111B21] truncate">{g.name || "未知"}</span>
                    {last.date && <span className="text-[11px] text-[#667781] flex-none">{last.date}</span>}
                  </div>
                  <div className="text-[13px] text-[#667781] truncate mt-0.5">
                    {[last.type, last.topic || last.title].filter(Boolean).join(" · ")}
                  </div>
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
