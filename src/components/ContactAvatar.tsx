import type { LibraryItem } from "@/lib/library";

export function ContactAvatar({ item, size = 46 }: { item: LibraryItem; size?: number }) {
  if (!item.isGroup) {
    return (
      <div
        className="flex-none rounded-full grid place-items-center bg-[#DFE5E7]"
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
        className="absolute rounded-full grid place-items-center bg-[#DFE5E7] ring-2 ring-white"
        style={{ width: circle, height: circle, top: 0, left: 0, fontSize }}
      >
        {shown[0]}
      </div>
      <div
        className="absolute rounded-full grid place-items-center bg-[#DFE5E7] ring-2 ring-white"
        style={{ width: circle, height: circle, bottom: 0, right: 0, fontSize }}
      >
        {shown[1]}
        {extra > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-[#00A884] text-white rounded-full px-1 text-[9px] leading-tight">
            +{extra}
          </span>
        )}
      </div>
    </div>
  );
}
