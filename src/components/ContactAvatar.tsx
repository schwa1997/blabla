import type { LibraryItem } from "@/lib/library";

export function ContactAvatar({
  item,
  size = 46,
  ringClass = "ring-surface-raised",
}: {
  item: LibraryItem;
  size?: number;
  // matches the background behind the avatar so the overlapping group circles read as cut-outs
  ringClass?: string;
}) {
  if (!item.isGroup) {
    return (
      <div
        className="flex-none rounded-full grid place-items-center bg-avatar"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
      >
        {item.partnerAvatar || "💬"}
      </div>
    );
  }

  const shown = item.otherAvatars.slice(0, 2);
  const extra = item.otherAvatars.length - shown.length;
  const circle = Math.round(size * 0.66);
  const fontSize = Math.round(circle * 0.5);

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <div
        className={`absolute rounded-full grid place-items-center bg-avatar ring-2 ${ringClass}`}
        style={{ width: circle, height: circle, top: 0, left: 0, fontSize }}
      >
        {shown[0]}
      </div>
      <div
        className={`absolute rounded-full grid place-items-center bg-avatar ring-2 ${ringClass}`}
        style={{ width: circle, height: circle, bottom: 0, right: 0, fontSize }}
      >
        {shown[1]}
        {extra > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-moon text-side rounded-full px-1 text-[9px] leading-tight">
            +{extra}
          </span>
        )}
      </div>
    </div>
  );
}
