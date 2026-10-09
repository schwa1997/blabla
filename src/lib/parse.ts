export type Role = { avatar: string; name: string };
export type MediaType = "image" | "video" | "audio";
export type Message = {
  who: string;
  text: string;
  media?: { type: MediaType; filename: string };
};
export type ConversationData = {
  title: string;
  topic: string;
  type: string;
  date: string;
  roles: Record<string, Role>;
  messages: Message[];
};

const MEDIA_PREFIXES: Record<string, MediaType> = {
  img: "image",
  video: "video",
  audio: "audio",
};

/**
 * Format:
 *   title: ... / topic: ... / type: ... / date: ...
 *   role: id avatar display name
 *   ---
 *   who: text
 *   who: img:file.jpg   (or video:/audio:) — next line(s) with no "who:" prefix are the caption
 */
export function parseConversation(text: string): ConversationData {
  const out: ConversationData = {
    title: "",
    topic: "",
    type: "",
    date: "",
    roles: {},
    messages: [],
  };
  const lines = text.replace(/\r/g, "").split("\n");
  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---" || trimmed.startsWith("#")) continue;
    const m = line.match(/^\s*([^:：\s]+)\s*[:：]\s?(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2];
      if (key === "title") {
        out.title = val.trim();
        continue;
      }
      if (key === "topic") {
        out.topic = val.trim();
        continue;
      }
      if (key === "type") {
        out.type = val.trim();
        continue;
      }
      if (key === "date") {
        out.date = val.trim();
        continue;
      }
      if (key === "role") {
        const [id, avatar, ...name] = val.trim().split(/\s+/);
        if (id) out.roles[id] = { avatar: avatar || id[0], name: name.join(" ") || id };
        continue;
      }
      out.messages.push({ who: key, text: val });
    } else if (out.messages.length) {
      out.messages[out.messages.length - 1].text += "\n" + trimmed;
    }
  }
  for (const msg of out.messages) {
    if (!out.roles[msg.who]) {
      out.roles[msg.who] = { avatar: msg.who[0].toUpperCase(), name: msg.who };
    }
    const mm = msg.text.match(/^(img|video|audio):(\S+)[ \t]*\n?([\s\S]*)$/);
    if (mm) {
      msg.media = { type: MEDIA_PREFIXES[mm[1]], filename: mm[2] };
      msg.text = mm[3].trim();
    }
  }
  return out;
}

export function partnerRole(data: ConversationData) {
  const id = Object.keys(data.roles).find((k) => k !== "me");
  return id ? { id, ...data.roles[id] } : null;
}
