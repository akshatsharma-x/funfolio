// PART 17 · the web app manifest: BYTE's head for home screens, the night canvas as the splash colour.
import type { MetadataRoute } from "next";
import { player } from "@/content/content";
import { site } from "@/content/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: player.handle,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0E0B1E",
    theme_color: "#0E0B1E",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
