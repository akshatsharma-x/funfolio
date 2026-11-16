import Image from "next/image";
import type { ReactNode } from "react";
import { education, player } from "@/content/content";
import { known } from "@/content/derived";
import { bio, cgpa, characterSheet, crateFact, focusRadar, nowPlaying, perks, previousSaves, quickStats, spawnPoint } from "@/content/profile";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Soon } from "@/components/ui/ComingSoon";
import { Meter } from "@/components/ui/Meter";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PeelDoodle, PeelFact, PeelJoke } from "@/components/ui/PeelSecrets";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { AvatarButton } from "./profile/AvatarButton";
import { Equalizer } from "./profile/Equalizer";
import { FocusRadar } from "./profile/FocusRadar";
import { MysteryCrate } from "./profile/MysteryCrate";
import { PerkCard } from "./profile/PerkCard";
import { PixelAvatar } from "./profile/PixelAvatar";
import { ProfileDeal } from "./profile/ProfileDeal";
import { XpRing } from "./profile/XpRing";
import { WorldSection } from "./parts";

/** "GAME NAME · plain name" (R9): every tile says what it is in plain words too. */
function TileTitle({ id, game, plain }: { id: string; game: string; plain: string }) {
  return (
    <h3 id={id} className="tile-title">
      <span className="tile-title__game">{game}</span> <span className="tile-title__plain">· {plain}</span>
    </h3>
  );
}

function Tile({ area, id, game, plain, tilt = 4, peel, peelLabel, speedrun, children }: { area: string; id: string; game: string; plain: string; tilt?: number | false; peel?: ReactNode; peelLabel?: string; speedrun?: "hide"; children: ReactNode }) {
  return (
    <StickerCard
      as="article"
      className={`bento__tile bento__tile--${area}`}
      bodyClassName="bento__body"
      aria-labelledby={id}
      tilt={tilt !== false}
      tiltMax={tilt || 0}
      peel={peel}
      peelLabel={peelLabel}
      data-speedrun={speedrun}
    >
      <TileTitle id={id} game={game} plain={plain} />
      {children}
    </StickerCard>
  );
}

/** World 1 · PLAYER PROFILE · About — the character-sheet bento (PART 6). Every value comes from content.ts (R1). */
export function ProfileSection() {
  const sheet = characterSheet();
  const story = bio();
  const gpa = cgpa();
  const now = nowPlaying();
  const spawn = spawnPoint();

  return (
    <WorldSection id="profile" world="profile" labelledBy="profile-title">
      <WorldHeader world="profile" id="profile-title" />
      <ProfileDeal className="bento">
        <Tile area="character" id="profile-character" game="Character card" plain="Profile" peel={<PeelDoodle name="byte" caption="BYTE approves." />} peelLabel="Peek under the character card">
          <div className="char">
            <div className="char__frame">
              <span className="holo-ring" aria-hidden="true">
                <span className="holo-ring__spin" />
              </span>
              <AvatarButton label="Wave at the avatar — BYTE flies in for a high-five">
                {known(player.photo) ? (
                  <Image src={player.photo} alt={`Photo of ${player.name}`} fill sizes="(min-width: 1024px) 20vw, 60vw" className="object-cover" />
                ) : (
                  <span className="avatar-breath">
                    <PixelAvatar />
                  </span>
                )}
              </AvatarButton>
            </div>
            <dl className="char__sheet">
              <div className="char__row char__row--name">
                <dt>Name</dt>
                <dd>{sheet.name}</dd>
              </div>
              {sheet.className ? (
                <div className="char__row">
                  <dt>Class</dt>
                  <dd>{sheet.className}</dd>
                </div>
              ) : null}
              {sheet.subclass ? (
                <div className="char__row">
                  <dt>Subclass</dt>
                  <dd>{sheet.subclass}</dd>
                </div>
              ) : null}
              <div className="char__row">
                <dt>Guild</dt>
                <dd>{sheet.guild}</dd>
              </div>
              {sheet.online ? (
                <div className="char__row">
                  <dt>Status</dt>
                  <dd>
                    <span className="status-dot" aria-hidden="true" /> <span className="char__online">Online</span> @ {sheet.online}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Tile>

        <Tile area="origin" id="profile-origin" game="Origin story" plain="Bio" tilt={3} peel={<PeelFact n={0} />}>
          {/* DRAFT while player.bio is "TODO": bioDraft() in content/profile.ts, built only from content.ts facts */}
          <p className="read origin__text" data-draft={story.draft ? "" : undefined}>
            {story.lines.join(" ")}
          </p>
          {player.funFacts.length > 0 ? (
            <>
              <h4 className="tile-sub">Fun facts</h4>
              <ul className="read grid list-disc gap-1 pl-5">
                {player.funFacts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Tile>

        <Tile area="xp" id="profile-xp" game="XP stats" plain="Grades" peel={<PeelJoke n={3} />}>
          <div className="xp">
            {gpa ? <XpRing value={gpa.text} max={gpa.max} ratio={gpa.ratio} label="CGPA" /> : <Soon />}
            <p className="xp__degree">
              <span className="xp__label">CGPA</span>
              <span>{education.degree}</span>
              <span className="text-muted">{education.period}</span>
            </p>
          </div>
          <h4 className="tile-sub">Previous saves</h4>
          <div className="grid gap-3">
            {previousSaves().map((s) => (
              <Meter key={s.name} label={s.name} value={s.percent} max={100} segments={20} rounding="floor" valueText={`${s.score} · ${s.year}`} tone="world" />
            ))}
          </div>
        </Tile>

        <Tile area="now" id="profile-now" game="Currently playing" plain="Current role">
          {now ? (
            <div className="now">
              <Equalizer />
              <p className="now__role">
                <strong>{now.role}</strong> @ {now.company} <span className="now__since">· since {now.since}</span>
              </p>
              {now.focus.length ? (
                <ul className="now__focus" aria-label="Working on">
                  {now.focus.map((f) => (
                    <li key={f}>
                      <Chip tone="world">{f}</Chip>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <Soon />
          )}
        </Tile>

        <Tile area="perks" id="profile-perks" game="Perks" plain="Highlights" tilt={false} peel={<PeelJoke n={5} />}>
          <p className="tile-hint">Hover, focus or tap a card to flip it.</p>
          <ul className="perks">
            {perks().map((p) => (
              <li key={p.id}>
                <PerkCard perk={p} />
              </li>
            ))}
          </ul>
        </Tile>

        <Tile area="stats" id="profile-stats" game="Quick stats" plain="Totals" peel={<PeelFact n={1} />}>
          <dl className="qstats">
            {quickStats().map((s) => (
              <div key={s.label} className="qstats__item">
                <dt>{s.label}</dt>
                <dd>
                  <NumberRoll value={String(s.value)} />
                </dd>
              </div>
            ))}
          </dl>
        </Tile>

        <Tile area="radar" id="profile-radar" game="Focus radar" plain="Experience by area" tilt={3}>
          <FocusRadar axes={focusRadar()} titleId="profile-radar" />
        </Tile>

        <Tile area="training" id="profile-training" game="Training grounds" plain="Coursework" peel={<PeelDoodle name="coffee" caption="Exam fuel." />}>
          <ul className="training">
            {education.coursework.map((c) => (
              <li key={c}>
                <Badge tone="world" icon="scroll" className="training__badge">
                  {c}
                </Badge>
              </li>
            ))}
          </ul>
        </Tile>

        <Tile area="crate" id="profile-crate" game="Mystery crate" plain="Easter egg" tilt={false} speedrun="hide">
          <MysteryCrate fact={crateFact()} />
        </Tile>

        {spawn ? (
          <Tile area="spawn" id="profile-spawn" game="Spawn point" plain="Location" tilt={false}>
            <p className="spawn">
              <span className="spawn__pin" aria-hidden="true" />
              {spawn}
            </p>
          </Tile>
        ) : null}
      </ProfileDeal>
    </WorldSection>
  );
}
