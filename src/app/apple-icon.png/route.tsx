// PART 17 · the home-screen icon: BYTE's head (src/content/brand.ts) on the night canvas, rendered at build time.
import { ImageResponse } from "next/og";
import { BYTE_HEAD_PALETTE, BYTE_HEAD_ROWS, pixelRects } from "@/content/brand";

export const dynamic = "force-static";

const size = { width: 180, height: 180 };

export function GET() {
  const rects = pixelRects(BYTE_HEAD_ROWS, BYTE_HEAD_PALETTE, 9);
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#0E0B1E" }}>
        <svg width={144} height={144} viewBox="0 0 144 144">
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
