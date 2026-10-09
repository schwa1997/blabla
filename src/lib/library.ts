import { parseConversation, partnerRole } from "./parse";

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
};

export type PartnerGroup = {
  id: string;
  name: string;
  avatar: string;
  items: LibraryItem[];
};

function localISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildLibraryItem(folder: string, name: string, text: string, mtimeMs: number): LibraryItem {
  const data = parseConversation(text);
  const partner = partnerRole(data);
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
  };
}

export function buildPartners(library: LibraryItem[]): PartnerGroup[] {
  const map = new Map<string, PartnerGroup>();
  library.forEach((item) => {
    if (!map.has(item.partnerId)) {
      map.set(item.partnerId, {
        id: item.partnerId,
        name: item.partnerName,
        avatar: item.partnerAvatar,
        items: [],
      });
    }
    map.get(item.partnerId)!.items.push(item);
  });
  const groups = Array.from(map.values());
  groups.forEach((g) =>
    g.items.sort((a, b) => (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0))
  );
  groups.sort((a, b) => {
    const da = Date.parse(a.items[a.items.length - 1].date) || 0;
    const db = Date.parse(b.items[b.items.length - 1].date) || 0;
    return db - da;
  });
  return groups;
}
