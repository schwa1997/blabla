"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { ReadViewPartner } from "@/components/ReadView";
import { ExportView, type ExportViewHandle } from "@/components/ExportView";
import { parseConversation } from "@/lib/parse";
import { buildLibraryItem, buildPartners, type LibraryItem, type PartnerGroup } from "@/lib/library";
import { buildMediaMap, revokeMediaMap, type MediaMeta } from "@/lib/media";

const SAMPLE = `title: 和一棵树的对话
topic: 自我评价与存在
type: 哲学
role: me 🙋‍♀️ 我
role: tree 🌳 树
---
me: 你是不是也有烦恼啊？
tree: 为什么这么问？
me: 你还年轻的时候，会不会担心自己长不成参天大树？
me: 就像人类一样，总怕自己没长成该有的样子。
tree: 会，但也不会。
me: 什么意思？
tree: 我们也有丛林法则。要往上长，要争更多的阳光。
tree: 长得慢一点，可能就被别的树挡住了。
me: 那不就跟人一样吗？
tree: 有一点不一样。
tree: 没有别的树会 judge 我。
tree: 我长成什么样，就只是一种状态。
tree: 高一点，矮一点，弯一点，都只是"是这样"。
tree: 没有好，也没有不好。
me: ……所以让我们痛苦的，可能不是没长高，而是被打分。
tree: 你们人类给什么都打分，连自己也是。`;

const DEMO_GROUP: PartnerGroup = {
  id: "_demo",
  name: "树",
  avatar: "🌳",
  items: [
    {
      id: "_demo-item",
      name: "demo.txt",
      text: SAMPLE,
      title: "和一棵树的对话",
      topic: "自我评价与存在",
      type: "哲学",
      date: "",
      partnerId: "tree",
      partnerName: "树",
      partnerAvatar: "🌳",
    },
  ],
};

type Tab = "read" | "export";

export default function Home() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, MediaMeta>>(new Map());
  const [query, setQuery] = useState("");
  const [activePartnerId, setActivePartnerId] = useState<string | null>(DEMO_GROUP.id);
  const [currentFileId, setCurrentFileId] = useState<string | null>(DEMO_GROUP.items[0].id);
  const [tab, setTab] = useState<Tab>("read");
  const [status, setStatus] = useState("");
  const pendingExportAllRef = useRef(false);
  const exportRef = useRef<ExportViewHandle>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const groups = useMemo<PartnerGroup[]>(
    () => (library.length ? buildPartners(library) : [DEMO_GROUP]),
    [library]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      g.items.some((item) => {
        const hay = [item.title, item.topic, item.type, g.name, item.date, item.text].join(" ").toLowerCase();
        return hay.includes(q);
      })
    );
  }, [groups, query]);

  const activeGroup = groups.find((g) => g.id === activePartnerId) ?? groups[0];
  const activeItem =
    activeGroup?.items.find((it) => it.id === currentFileId) ?? activeGroup?.items[activeGroup.items.length - 1];
  const activeData = useMemo(() => parseConversation(activeItem?.text ?? ""), [activeItem]);

  useEffect(() => {
    if (tab === "export" && pendingExportAllRef.current) {
      pendingExportAllRef.current = false;
      exportRef.current?.exportAll();
    }
  }, [tab]);

  async function handleOpenFolder(fileList: FileList) {
    const all = Array.from(fileList);
    const txtFiles = all.filter((f) => /\.txt$/i.test(f.name));
    if (!txtFiles.length) {
      setStatus("这个文件夹里没有找到 .txt 对话文件");
      return;
    }
    const newMediaMap = await buildMediaMap(all);
    setMediaMap((prev) => {
      revokeMediaMap(prev);
      return newMediaMap;
    });
    const loaded = await Promise.all(txtFiles.map(async (f) => buildLibraryItem(f, await f.text())));
    setLibrary(loaded);
    setQuery("");
    const newGroups = buildPartners(loaded);
    if (newGroups.length) {
      const top = newGroups[0];
      const last = top.items[top.items.length - 1];
      setActivePartnerId(top.id);
      setCurrentFileId(last.id);
    }
    setTab("read");
    setStatus(`已打开文件夹，共 ${loaded.length} 篇对话，来自 ${newGroups.length} 个 partner`);
  }

  function handleSelectPartner(g: PartnerGroup) {
    setActivePartnerId(g.id);
    const last = g.items[g.items.length - 1];
    setCurrentFileId(last.id);
    setTab("read");
    requestAnimationFrame(() => {
      if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    });
  }

  function handleExportAllClick() {
    if (tab === "export") {
      exportRef.current?.exportAll();
    } else {
      pendingExportAllRef.current = true;
      setTab("export");
    }
  }

  const headerSub =
    activeGroup === DEMO_GROUP
      ? [activeItem?.type, activeItem?.topic].filter(Boolean).join(" · ")
      : `共 ${activeGroup?.items.length ?? 0} 篇对话`;

  return (
    <div className="grid grid-cols-[300px_1fr] h-full">
      <Sidebar
        groups={filteredGroups}
        query={query}
        onQueryChange={setQuery}
        activePartnerId={activePartnerId}
        onSelectPartner={handleSelectPartner}
        onOpenFolder={handleOpenFolder}
        status={status}
      />
      <main className="flex flex-col min-h-0 bg-[#EFEAE2]">
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-[#F0F2F5] border-b border-[#E9EDEF]">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="size-10 bg-[#DFE5E7]">
              <AvatarFallback className="bg-transparent text-xl">{activeGroup?.avatar ?? "💬"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#111B21] truncate">{activeGroup?.name ?? "无题"}</div>
              {headerSub && <div className="text-xs text-[#667781] mt-0.5 truncate">{headerSub}</div>}
            </div>
          </div>
          <Button onClick={handleExportAllClick} className="bg-[#008069] text-white hover:bg-[#008069]/90 flex-none">
            导出图片
          </Button>
        </div>

        <div className="flex gap-2 px-5 pt-2.5">
          {(["read", "export"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`text-[13px] px-4 py-1.5 rounded-full border transition-colors ${
                tab === t ? "bg-[#008069] text-white border-[#008069]" : "bg-white text-[#667781] border-[#E9EDEF]"
              }`}
            >
              {t === "read" ? "阅读" : "导出预览"}
            </button>
          ))}
        </div>

        <div ref={chatAreaRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          {tab === "read" && (
            <ReadViewPartner
              group={activeGroup}
              currentFileId={currentFileId}
              mediaMap={mediaMap}
              onSelectItem={(item) => setCurrentFileId(item.id)}
            />
          )}
          {tab === "export" && (
            <ExportView ref={exportRef} data={activeData} mediaMap={mediaMap} onStatus={setStatus} />
          )}
        </div>
      </main>
    </div>
  );
}
