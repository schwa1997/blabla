"use client";

import { useEffect, useRef } from "react";
import type { ConversationData, Message, Role } from "@/lib/parse";
import { Highlight } from "./Highlight";
import { MediaBlock } from "./MediaBlock";
import { ME_AVATAR_SRC } from "@/lib/me";

// WhatsApp's group-chat sender colors
const NAME_COLORS = ["#e542a3", "#1f7aec", "#d3396d", "#02a698", "#7f66ff", "#c56b00", "#35b27c", "#fa6533"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Conversations carry no timestamps, so derive stable evening times from the folder name.
function timeFor(seed: string, index: number) {
  const minutes = 20 * 60 + (hash(seed) % 150) + Math.floor(index * 0.6);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

function Tail({ out }: { out: boolean }) {
  return (
    <svg
      viewBox="0 0 8 13"
      width="8"
      height="13"
      aria-hidden
      className={`absolute top-0 ${out ? "-right-2 text-wa-out" : "-left-2 text-wa-in"}`}
    >
      <path
        fill="currentColor"
        d={
          out
            ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
            : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
        }
      />
    </svg>
  );
}

function Ticks() {
  return (
    <svg
      viewBox="0 0 18 11"
      width="16"
      height="11"
      aria-label="已读"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-wa-tick"
    >
      <path d="M1 6l3 3.2L11 1" />
      <path d="M7.2 8.6l.8.6L15 1" />
    </svg>
  );
}

function Bubble({
  msg,
  role,
  first,
  isGroup,
  folder,
  highlight,
  time,
}: {
  msg: Message;
  role: Role;
  first: boolean;
  isGroup: boolean;
  folder: string;
  highlight: string;
  time: string;
}) {
  const out = msg.who === "me";
  const showName = isGroup && !out && first;
  const meta = (
    <>
      {time}
      {out && <Ticks />}
    </>
  );

  return (
    <div className={`flex items-start gap-2.5 ${out ? "flex-row-reverse" : ""} ${first ? "mt-3" : "mt-0.5"}`}>
      {/* avatar only on the first bubble of a run; later ones keep the slot so bubbles stay aligned */}
      <div
        className={`size-8 flex-none rounded-full overflow-hidden grid place-items-center text-base bg-avatar ${
          first ? "" : "invisible"
        }`}
      >
        {out ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ME_AVATAR_SRC} alt={role.name} className="size-full object-cover" />
        ) : (
          role.avatar
        )}
      </div>
      <div
        className={`relative max-w-[65%] text-wa-text shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] rounded-[7.5px] ${
          out ? "bg-wa-out" : "bg-wa-in"
        } ${first ? (out ? "rounded-tr-none" : "rounded-tl-none") : ""} ${msg.media ? "p-[3px]" : ""}`}
      >
        {first && <Tail out={out} />}
        {showName && (
          <div
            className={`text-[12.8px] font-medium leading-snug ${msg.media ? "px-1.5 pt-0.5 pb-1" : "px-2 pt-1.5"}`}
            style={{ color: NAME_COLORS[hash(msg.who) % NAME_COLORS.length] }}
          >
            {role.name}
          </div>
        )}
        {msg.media && (
          <div className="relative overflow-hidden rounded-[6px]">
            <MediaBlock folder={folder} media={msg.media} />
            {!msg.text && (
              <span className="absolute right-1.5 bottom-1 flex items-center gap-1 text-[11px] text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.6)]">
                {meta}
              </span>
            )}
          </div>
        )}
        {msg.text && (
          <div
            className={`relative text-[14.2px] leading-[19px] whitespace-pre-wrap break-words ${
              msg.media ? "px-1.5 pt-1 pb-1.5" : `px-2 pb-2 ${showName ? "pt-0.5" : "pt-1.5"}`
            }`}
          >
            <Highlight text={msg.text} query={highlight} />
            {/* invisible spacer reserves room so the time never overlaps the last line, as in WhatsApp */}
            <span className={`inline-block ${out ? "w-[68px]" : "w-[46px]"}`} />
            <span className="absolute right-2 bottom-1 flex items-center gap-1 text-[11px] leading-none text-wa-meta">
              {meta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadView({
  data,
  folder,
  date = "",
  highlight = "",
}: {
  data: ConversationData;
  folder: string;
  date?: string;
  highlight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isGroup = Object.keys(data.roles).filter((id) => id !== "me").length > 1;

  // bring the first search match into view when opening a conversation from search
  useEffect(() => {
    if (!highlight.trim()) return;
    ref.current?.querySelector("mark.hit")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [data, highlight]);

  if (!data.messages.length) {
    return <p className="text-wa-meta text-sm py-10 text-center">在这里打开一个文件夹，浏览里面的每一篇对话</p>;
  }
  return (
    <div ref={ref} className="max-w-[860px] mx-auto px-[4%] md:px-[7%] pb-4">
      <div className="flex justify-center pt-1 pb-1">
        <span className="text-[12.5px] text-wa-meta bg-wa-chip rounded-[7.5px] px-3 py-1.5 shadow-[0_1px_0.5px_rgb(11_20_26/0.13)] uppercase">
          {date || data.date || "今天"}
        </span>
      </div>
      <div className="flex flex-col">
        {data.messages.map((msg, i) => (
          <Bubble
            key={i}
            msg={msg}
            role={data.roles[msg.who] ?? { name: msg.who, avatar: "💬" }}
            first={i === 0 || data.messages[i - 1].who !== msg.who}
            isGroup={isGroup}
            folder={folder}
            highlight={highlight}
            time={timeFor(folder, i)}
          />
        ))}
      </div>
    </div>
  );
}
