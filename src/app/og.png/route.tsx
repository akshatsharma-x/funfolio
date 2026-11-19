// PART 17 · the share card: a game "character card" (name in pixel letters, class, LV badge, palette, BYTE and a
// pixel coin), rendered once at BUILD time (force-static → out/og.png) with next/og's bundled renderer and font — no
// request, nothing to renew (R10). The og:image tag points here once site.url is known (an OG image must be absolute).
import { ImageResponse } from "next/og";
import { BYTE_HEAD_PALETTE, BYTE_HEAD_ROWS, PIXEL_FONT, RAINBOW, pixelRects } from "@/content/brand";
import { player } from "@/content/content";
import { PIXEL_ICONS } from "@/components/ui/pixel-icons";

export const dynamic = "force-static";

const INK = "#07060F";

function PixelWord({ word, size, colorAt }: { word: string; size: number; colorAt: (i: number) => string }) {
  const letters = [...word.toUpperCase()].filter((c) => PIXEL_FONT[c]);
  const w = letters.length * 6 * size - size;
  const rects = letters.flatMap((c, i) => pixelRects(PIXEL_FONT[c], { "#": colorAt(i) }, size, i * 6 * size, 0));
  return (
    <svg width={w} height={7 * size} viewBox={`0 0 ${w} ${7 * size}`}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  );
}

function Pixels({ rows, palette, size }: { rows: readonly string[]; palette: Readonly<Record<string, string>>; size: number }) {
  const rects = pixelRects(rows, palette, size);
  return (
    <svg width={16 * size} height={rows.length * size} viewBox={`0 0 ${16 * size} ${rows.length * size}`}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  );
}

export function GET() {
  const [first, ...rest] = player.name.split(/\s+/);
  const coin = PIXEL_ICONS.coin;
  const coinPalette = Object.fromEntries(Object.entries(coin.palette).map(([k, v]) => [k, k === "k" ? INK : v]));
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: "#0E0B1E", color: "#FFF4E0", position: "relative" }}>
        <div style={{ display: "flex", height: 14 }}>
          {RAINBOW.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", flex: 1, padding: "44px 56px 36px", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flex: 1, gap: 48, padding: 40, border: `6px solid ${INK}`, borderRadius: 28, background: "#1A1535", boxShadow: `0 10px 0 ${INK}` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div style={{ display: "flex", padding: 18, border: `5px solid ${INK}`, borderRadius: 22, background: "#251E4A" }}>
                <Pixels rows={BYTE_HEAD_ROWS} palette={BYTE_HEAD_PALETTE} size={12} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", border: `4px solid ${INK}`, borderRadius: 999, background: "#FFC83D", color: INK, fontSize: 30 }}>LV 10</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, flex: 1 }}>
              <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#2EE59D" }}>PLAYER 1 · {player.handle}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PixelWord word={first} size={11} colorAt={(i) => RAINBOW[i % RAINBOW.length]} />
                {rest.length ? <PixelWord word={rest.join("")} size={11} colorAt={(i) => RAINBOW[(i + 3) % RAINBOW.length]} /> : null}
              </div>
              <div style={{ display: "flex", fontSize: 25, color: "#FFF4E0" }}>{player.classes.slice(0, 3).join(" · ")}</div>
              <div style={{ display: "flex", fontSize: 24, color: "#B9B2D9" }}>{player.status}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
            <Pixels rows={coin.rows} palette={coinPalette} size={3} />
            <div style={{ display: "flex", color: "#FFC83D" }}>{player.tagline}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
