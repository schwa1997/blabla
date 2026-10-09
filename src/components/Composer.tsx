"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

const MAX_HEIGHT = 120;

export function Composer({
  onSend,
  disabledReason,
}: {
  onSend: (text: string) => Promise<string | null>; // resolves to an error message, or null when sent
  // when set, the composer is read-only and shows this as its placeholder
  disabledReason?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const disabled = !!disabledReason;
  const canSend = !disabled && !sending && text.trim().length > 0;

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
  }

  async function send() {
    if (!canSend) return;
    setSending(true);
    const err = await onSend(text);
    setSending(false);
    setError(err ?? "");
    if (!err) {
      setText("");
      requestAnimationFrame(resize);
    }
    ref.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="relative flex items-end gap-2 px-4 py-2.5 bg-wa-bar"
    >
      {error && (
        <p role="alert" className="absolute left-4 right-4 -top-8 m-0 text-center">
          <span className="inline-block text-xs text-white bg-[#d14343] rounded-md px-2.5 py-1 shadow">{error}</span>
        </p>
      )}
      <textarea
        ref={ref}
        rows={1}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          resize();
        }}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a line; ignore Enter while an IME (pinyin) is composing
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={disabledReason ?? "输入消息"}
        aria-label="输入消息"
        className="flex-1 min-w-0 resize-none rounded-lg bg-wa-field text-wa-text placeholder:text-wa-meta text-[15px] leading-5 px-3 py-[9px] outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ maxHeight: MAX_HEIGHT }}
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="发送"
        title="发送 (Enter)"
        className="grid place-items-center size-[38px] flex-none rounded-full bg-wa-send text-white transition-opacity disabled:opacity-40"
      >
        <SendHorizontal className="size-[18px]" />
      </button>
    </form>
  );
}
