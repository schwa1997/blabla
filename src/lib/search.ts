// Splits `text` into alternating plain / matched parts (case-insensitive).
// Odd indices are matches, so callers can wrap them in <mark>.
export function splitByQuery(text: string, query: string): string[] {
  const q = query.trim();
  if (!q) return [text];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "i"));
}

// A short excerpt around the first message line that contains `query`,
// used in the sidebar when the match is inside the conversation body.
export function findSnippet(conversationText: string, query: string, radius = 16): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const body =
    conversationText
      .split(/\n---\n/)
      .slice(1)
      .join("\n") || conversationText;
  for (const raw of body.split("\n")) {
    const line = raw.replace(/^[^:：\s]+[:：]\s*/, "").trim();
    const at = line.toLowerCase().indexOf(q);
    if (at === -1) continue;
    const start = Math.max(0, at - radius);
    const end = Math.min(line.length, at + q.length + radius);
    return (start > 0 ? "…" : "") + line.slice(start, end) + (end < line.length ? "…" : "");
  }
  return null;
}
