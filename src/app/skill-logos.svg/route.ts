// The Skill Tree's logo sprite (PART 13) as one static file: every tech logo once (simple-icons, monochrome), drawn by
// the nodes and slots with <use href="/skill-logos.svg#si-…">. Inline, the path data was paid twice — in the HTML and
// again in the RSC payload — and it compresses poorly; as a file it is fetched once, from the site itself (R10).
import { skillLogos } from "@/content/skills";

export const dynamic = "force-static";

export function GET() {
  const symbols = skillLogos()
    .map((l) => `<symbol id="${l.id}" viewBox="0 0 24 24"><path d="${l.path}"/></symbol>`)
    .join("");
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
