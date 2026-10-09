import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const CONVERSATIONS_DIR = path.join(process.cwd(), "conversations");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  // reject any traversal attempt before touching the filesystem
  if (segments.some((s) => s === ".." || s.includes("/") || s.includes("\\"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const full = path.join(CONVERSATIONS_DIR, ...segments);
  if (!full.startsWith(CONVERSATIONS_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const [buf, st] = await Promise.all([readFile(full), stat(full)]);
    const ext = path.extname(full).toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(st.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
