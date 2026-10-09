"use client";

import { Fragment } from "react";
import type { ConversationData, Message, Role } from "@/lib/parse";
import { parseConversation } from "@/lib/parse";
import type { LibraryItem, PartnerGroup } from "@/lib/library";
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

function ChatMessages({ data, folder }: { data: ConversationData; folder: string }) {
  return (
    <>
      {data.messages.map((msg, i) => {
        const grouped = i > 0 && data.messages[i - 1].who === msg.who;
        return <ReadRow key={i} msg={msg} role={data.roles[msg.who]} grouped={grouped} folder={folder} />;
      })}
    </>
  );
}

const EMPTY_HINT = "在这里打开一个文件夹，浏览里面的每一篇对话";

export function ReadViewPartner({
  group,
  currentFileId,
  onSelectItem,
}: {
  group: PartnerGroup | undefined;
  currentFileId: string | null;
  onSelectItem: (item: LibraryItem) => void;
}) {
  if (!group || !group.items.length) {
    return <p className="text-[#667781] text-sm py-10">{EMPTY_HINT}</p>;
  }
  return (
    <div className="max-w-[720px] mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#111B21] mb-1">{group.name || "无题"}</h2>
      </div>
      <div className="flex flex-col">
        {group.items.map((item) => {
          const data = parseConversation(item.text);
          const active = item.id === currentFileId;
          const label = [item.date, item.type, item.topic || item.title].filter(Boolean).join(" · ");
          return (
            <Fragment key={item.id}>
              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className={`self-center block mx-auto first:mt-0 mt-4 mb-3 px-3.5 py-1 rounded-full text-xs cursor-pointer ${
                  active ? "bg-[#00A884] text-white" : "bg-[#E1F2FB] text-[#54656F]"
                }`}
              >
                {label}
              </button>
              <ChatMessages data={data} folder={item.folder} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
