import { otherRoles, parseConversation } from "./parse";

export type LibraryItem = {
  id: string;
  folder: string;
  name: string;
  text: string;
  title: string;
  topic: string;
  type: string;
  date: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  isGroup: boolean;
  otherNames: string[];
  otherAvatars: string[];
};

function localISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildLibraryItem(folder: string, name: string, text: string, mtimeMs: number): LibraryItem {
  const data = parseConversation(text);
  const others = otherRoles(data);
  const partner = others[0] ?? null;
  return {
    id: folder,
    folder,
    name,
    text,
    title: data.title,
    topic: data.topic,
    type: data.type,
    date: data.date || localISODate(new Date(mtimeMs)),
    partnerId: partner ? partner.id : "_none",
    partnerName: partner ? partner.name : "未知",
    partnerAvatar: partner ? partner.avatar : "💬",
    isGroup: others.length > 1,
    otherNames: others.map((o) => o.name),
    otherAvatars: others.map((o) => o.avatar),
  };
}

export function sortByDateDesc(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
}
