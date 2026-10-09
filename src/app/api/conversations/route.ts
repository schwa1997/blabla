import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const CONVERSATIONS_DIR = path.join(process.cwd(), "conversations");

export type ConversationFile = {
  folder: string;
  name: string;
  text: string;
  mtimeMs: number;
};

export async function GET() {
  let entries;
  try {
    entries = await readdir(CONVERSATIONS_DIR, { withFileTypes: true });
  } catch {
    return NextResponse.json({ items: [] });
  }

  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const items: ConversationFile[] = [];
  for (const folder of folders) {
    const dir = path.join(CONVERSATIONS_DIR, folder);
    const files = await readdir(dir);
    const txtName = files.find((f) => f.toLowerCase().endsWith(".txt"));
    if (!txtName) continue;
    const full = path.join(dir, txtName);
    const [text, st] = await Promise.all([readFile(full, "utf8"), stat(full)]);
    items.push({ folder, name: txtName, text, mtimeMs: st.mtimeMs });
  }

  return NextResponse.json({ items });
}
