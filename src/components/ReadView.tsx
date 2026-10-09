"use client";

import { useEffect, useRef } from "react";
import type { ConversationData, Message, Role } from "@/lib/parse";
import { Highlight } from "./Highlight";
import { MediaBlock } from "./MediaBlock";

function ReadRow({
  msg,
  role,
  grouped,
  folder,
  highlight,
}: {
  msg: Message;
  role: Role;
  grouped: boolean;
  folder: string;
  highlight: string;
}) {
  const isMe = msg.who === "me";
  return (
    <div className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""} ${grouped ? "mt-1" : "mt-3"}`}>
      <div
        className={`w-8 h-8 flex-none rounded-full grid place-items-center text-base bg-avatar ${grouped ? "invisible" : ""}`}
      >
        {role.avatar}
      </div>
      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        {!grouped && <div className={`text-xs font-medium text-dusk mb-1 ${isMe ? "mr-1" : "ml-1"}`}>{role.name}</div>}
        <div
          className={`overflow-hidden text-ink shadow-[0_1px_2px_rgb(27_31_59/0.08)] ${
            isMe ? "bg-bubble-me rounded-[16px_4px_16px_16px]" : "bg-bubble-them rounded-[4px_16px_16px_16px]"
          }`}
        >
          {msg.media && <MediaBlock folder={folder} media={msg.media} />}
          {msg.text && (
            <div
              className={`text-sm leading-relaxed whitespace-pre-wrap break-words px-3 ${
                msg.media ? "pt-1.5 pb-2" : "py-2"
              }`}
            >
              <Highlight text={msg.text} query={highlight} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReadView({
  data,
  folder,
  highlight = "",
}: {
  data: ConversationData;
  folder: string;
  highlight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // bring the first search match into view when opening a conversation from search
  useEffect(() => {
    if (!highlight.trim()) return;
    ref.current?.querySelector("mark.hit")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [data, highlight]);

  if (!data.messages.length) {
    return <p className="text-ink-soft text-sm py-10">在这里打开一个文件夹，浏览里面的每一篇对话</p>;
  }
  return (
    <div ref={ref} className="max-w-[720px] mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-ink mb-1">{data.title || "无题"}</h2>
        {[data.type, data.topic].filter(Boolean).length > 0 && (
          <p className="text-sm text-ink-soft m-0">{[data.type, data.topic].filter(Boolean).join(" · ")}</p>
        )}
        <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-moon to-transparent" />
      </div>
      <div className="flex flex-col">
        {data.messages.map((msg, i) => {
          const grouped = i > 0 && data.messages[i - 1].who === msg.who;
          return (
            <ReadRow
              key={i}
              msg={msg}
              role={data.roles[msg.who]}
              grouped={grouped}
              folder={folder}
              highlight={highlight}
            />
          );
        })}
      </div>
    </div>
  );
}
