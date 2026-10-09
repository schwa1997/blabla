import { splitByQuery } from "@/lib/search";

export function Highlight({ text, query }: { text: string; query: string }) {
  const parts = splitByQuery(text, query);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="hit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
