"use client";

import type { ConversationData, Message, Role } from "@/lib/parse";
import { MediaBlock } from "./MediaBlock";

function ReadRow({ msg, role, grouped, folder }: { msg: Message; role: Role; grouped: boolean; folder: string }) {
  const isMe = msg.who === "me";
  return (
    <div className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""} ${grouped ? "mt-0.5" : "mt-2.5"}`}>
      <div
        className={`w-8 h-8 flex-none rounded-full grid place-items-center text-base bg-[#DFE5E7] ${grouped ? "invisible" : ""}`}
      >
        {role.avatar}
      </div>
      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        {!grouped && (
          <div className={`text-xs font-semibold text-[#005C4B] mb-0.5 ${isMe ? "mr-1" : "ml-1"}`}>{role.name}</div>
        )}
        <div
          className={`overflow-hidden shadow-[0_1px_1px_rgba(11,20,26,.08)] ${
            isMe ? "bg-[#D9FDD3] rounded-[12px_4px_12px_12px]" : "bg-white rounded-[4px_12px_12px_12px]"
          }`}
        >
          {msg.media && <MediaBlock folder={folder} media={msg.media} />}
          {msg.text && (
            <div
              className={`text-sm leading-relaxed whitespace-pre-wrap break-words px-2.5 ${
                msg.media ? "pt-1.5 pb-1.5" : "py-1.5"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReadView({ data, folder }: { data: ConversationData; folder: string }) {
  if (!data.messages.length) {
    return <p className="text-[#667781] text-sm py-10">在这里打开一个文件夹，浏览里面的每一篇对话</p>;
  }
  return (
    <div className="max-w-[720px] mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#111B21] mb-1">{data.title || "无题"}</h2>
        {[data.type, data.topic].filter(Boolean).length > 0 && (
          <p className="text-sm text-[#667781] m-0">{[data.type, data.topic].filter(Boolean).join(" · ")}</p>
        )}
      </div>
      <div className="flex flex-col">
        {data.messages.map((msg, i) => {
          const grouped = i > 0 && data.messages[i - 1].who === msg.who;
          return <ReadRow key={i} msg={msg} role={data.roles[msg.who]} grouped={grouped} folder={folder} />;
        })}
      </div>
    </div>
  );
}
