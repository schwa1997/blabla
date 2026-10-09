"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { ContactAvatar } from "@/components/ContactAvatar";
import { ReadView } from "@/components/ReadView";
import { ExportView, type ExportViewHandle } from "@/components/ExportView";
import { parseConversation } from "@/lib/parse";
import { buildLibraryItem, sortByDateDesc, type LibraryItem } from "@/lib/library";

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

const DEMO_ITEM: LibraryItem = {
  id: "_demo-item",
  folder: "_demo",
  name: "demo.txt",
  text: SAMPLE,
  title: "和一棵树的对话",
  topic: "自我评价与存在",
  type: "哲学",
  date: "",
  partnerId: "tree",
  partnerName: "树",
  partnerAvatar: "🌳",
  isGroup: false,
  otherNames: ["树"],
  otherAvatars: ["🌳"],
};

type Tab = "read" | "export";
type ConversationFile = { folder: string; name: string; text: string; mtimeMs: number };

export default function Home() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(DEMO_ITEM.id);
  const [tab, setTab] = useState<Tab>("read");
  const [status, setStatus] = useState("");
  const pendingExportAllRef = useRef(false);
  const exportRef = useRef<ExportViewHandle>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: ConversationFile[] }) => {
        if (cancelled || !data.items?.length) return;
        const items = sortByDateDesc(data.items.map((f) => buildLibraryItem(f.folder, f.name, f.text, f.mtimeMs)));
        setLibrary(items);
        setActiveItemId(items[0].id);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => (library.length ? library : [DEMO_ITEM]), [library]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = [item.title, item.topic, item.type, item.partnerName, item.date, item.text]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const activeItem = items.find((it) => it.id === activeItemId) ?? items[0];
  const activeData = useMemo(() => parseConversation(activeItem?.text ?? ""), [activeItem]);

  useEffect(() => {
    if (tab === "export" && pendingExportAllRef.current) {
      pendingExportAllRef.current = false;
      exportRef.current?.exportAll();
    }
  }, [tab]);

  function handleSelectItem(item: LibraryItem) {
    setActiveItemId(item.id);
    setTab("read");
    requestAnimationFrame(() => {
      if (chatAreaRef.current) chatAreaRef.current.scrollTop = 0;
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

  const headerPrimary = activeItem
    ? activeItem.isGroup
      ? activeItem.title || activeItem.otherNames.join("、")
      : activeItem.partnerName || activeItem.title
    : "";
  const headerSub = activeItem
    ? activeItem.isGroup
      ? activeItem.otherNames.join("、")
      : [activeItem.type, activeItem.topic || activeItem.title].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="grid grid-cols-[300px_1fr] h-full">
      <Sidebar
        items={filteredItems}
        query={query}
        onQueryChange={setQuery}
        activeItemId={activeItemId}
        onSelectItem={handleSelectItem}
        status={loaded ? status : "正在加载对话…"}
      />
      <main className="flex flex-col min-h-0 bg-[#EFEAE2]">
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-[#F0F2F5] border-b border-[#E9EDEF]">
          <div className="flex items-center gap-3.5 min-w-0">
            {activeItem && <ContactAvatar item={activeItem} size={40} />}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#111B21] truncate">{headerPrimary || "无题"}</div>
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
          {tab === "read" && activeItem && <ReadView data={activeData} folder={activeItem.folder} />}
          {tab === "export" && activeItem && (
            <ExportView ref={exportRef} folder={activeItem.folder} data={activeData} onStatus={setStatus} />
          )}
        </div>
      </main>
    </div>
  );
}
