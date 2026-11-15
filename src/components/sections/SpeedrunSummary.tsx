import { education, player, speedrun } from "@/content/content";
import { resolveHighlight, type ResolvedStat } from "@/content/derived";
import { SaveFileButton } from "./parts";

const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/**
 * Recruiter Speedrun Mode summary (PART 3 #11): name (the h1 above), current role, the strongest metrics, education,
 * links and the résumé — all server-rendered, shown only when <html data-mode="speedrun"> (CSS), so a recruiter link
 * (?speedrun) shows it at first paint. Every value is resolved from content.ts (R1).
 */
export function SpeedrunSummary({ resumeAvailable }: { resumeAvailable: boolean }) {
  const tiles = speedrun.highlights
    .map((t) => t.refs.map(resolveHighlight).filter((x): x is ResolvedStat => x !== null))
    .filter((t) => t.length > 0);

  return (
    <div className="speedrun-summary" aria-labelledby="speedrun-title">
      <h2 id="speedrun-title" className="speedrun-summary__kicker">
        Speedrun summary
      </h2>
      <p className="speedrun-summary__role text-lg font-semibold">{player.status}</p>
      <ul className="speedrun-summary__tiles" aria-label="Highlights">
        {tiles.map((stats) => (
          <li key={stats.map((s) => s.label).join("+")} className="speedrun-tile">
            <span className="speedrun-tile__values">
              {stats.map((s, i) => (
                <span key={s.label}>
                  {i > 0 ? <span className="text-muted"> / </span> : null}
                  <span className="speedrun-tile__value">{s.value}</span>{" "}
                  <span className="speedrun-tile__label">{s.label}</span>
                </span>
              ))}
            </span>
            <span className="speedrun-tile__context">{stats[0].context}</span>
          </li>
        ))}
      </ul>
      <p className="speedrun-summary__edu text-muted">
        {education.degree} · {education.school} · CGPA {education.cgpa} · {education.period}
      </p>
      <ul className="speedrun-summary__links flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Contact links">
        <li>
          <a href={`mailto:${player.email}`} data-cursor-label="OPEN" className="font-semibold underline">
            {player.email}
          </a>
        </li>
        <li>
          <a href={player.links.linkedin} rel="me noreferrer" data-cursor-label="OPEN" className="font-semibold underline">
            {display(player.links.linkedin)}
          </a>
        </li>
        <li>
          <a href={player.links.github} rel="me noreferrer" data-cursor-label="OPEN" className="font-semibold underline">
            {display(player.links.github)}
          </a>
        </li>
      </ul>
      <div className="speedrun-summary__actions flex flex-wrap items-center gap-4">
        <SaveFileButton href={player.resumeUrl} available={resumeAvailable} size="md" />
        <a href="#profile" className="speedrun-summary__more font-pixel text-sm uppercase tracking-wider">
          ▼ Details below
        </a>
      </div>
    </div>
  );
}
