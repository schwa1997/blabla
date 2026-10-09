import { NextRequest, NextResponse } from "next/server";
import { appendFile, readdir, readFile, stat } from "fs/promises";
import path from "path";

const CONVERSATIONS_DIR = path.join(process.cwd(), "conversations");
// Vercel's filesystem is read-only at runtime, so sending only works locally
const WRITABLE = !process.env.VERCEL;

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
    return NextResponse.json({ items: [], writable: false });
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

  return NextResponse.json({ items, writable: WRITABLE });
}

// Turns typed text into conversation lines spoken by "me". Lines without a "who:" prefix
// continue the previous message, unless they'd be misread as a key, a separator or a comment.
function toConversationLines(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line, i) =>
    i === 0 || /^[^:：\s]+\s*[:：]/.test(line) || line === "---" || line.startsWith("#") ? `me: ${line}` : line,
  );
}

async function findConversationFile(folder: string) {
  if (!folder || folder.startsWith(".") || /[\\/]/.test(folder)) return null;
  const dir = path.join(CONVERSATIONS_DIR, folder);
  try {
    const txtName = (await readdir(dir)).find((f) => f.toLowerCase().endsWith(".txt"));
    return txtName ? { name: txtName, full: path.join(dir, txtName) } : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!WRITABLE) {
    return NextResponse.json({ error: "线上版本是只读的，请在本地运行时发送" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { folder?: unknown; text?: unknown } | null;
  const folder = typeof body?.folder === "string" ? body.folder : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 4000) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }
  const file = await findConversationFile(folder);
  if (!file) {
    return NextResponse.json({ error: "找不到这篇对话" }, { status: 404 });
  }

  const current = await readFile(file.full, "utf8");
  const sep = current === "" || current.endsWith("\n") ? "" : "\n";
  await appendFile(file.full, sep + toConversationLines(text).join("\n") + "\n", "utf8");

  const [updated, st] = await Promise.all([readFile(file.full, "utf8"), stat(file.full)]);
  const item: ConversationFile = { folder, name: file.name, text: updated, mtimeMs: st.mtimeMs };
  return NextResponse.json({ item });
}
