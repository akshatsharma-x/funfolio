import { BYTE_INVITE, MESSAGE_MAX, NAME_MAX, PLANE, QUEST_TYPES } from "@/lib/invite";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { PixelFrame } from "@/components/ui/PixelFrame";
import { PixelIcon } from "@/components/ui/PixelIcon";

/**
 * PARTY INVITE · Contact form (PART 15): an RPG dialog (PixelFrame) where BYTE types its line. Player name, a quest
 * type (chips) and a message. With JS the island validates them (zod/mini, in-character errors), folds the form into a
 * paper plane, and the plane flies into the mailbox portal — then a mailto: opens in the visitor's own mail app, with
 * [Copy message] for people without one. Without JS the same form submits as a plain mailto: form with native
 * `required` checks — nothing here needs a server, ever (R10).
 */
export function PartyInvite({ email }: { email: string }) {
  return (
    <section className="invite" aria-labelledby="invite-title" data-invite="">
      <h3 id="invite-title" className="lobby-h">
        Party invite <span className="lobby-h__plain">· Contact form</span>
      </h3>
      <PixelFrame className="invite__frame" innerClassName="invite__inner">
        <div className="invite__byte">
          <span className="invite__portrait" aria-hidden="true">
            <PixelIcon name="byte" size={48} />
          </span>
          <p className="invite__say" data-invite-say="">
            {/* screen readers get the whole line at once (and every later one); the eye gets it typed */}
            <span className="sr-only">
              BYTE says: <span data-invite-sr="">{BYTE_INVITE}</span>
            </span>
            <span className="invite__line" data-invite-line="" aria-hidden="true">
              <span className="invite__ghost">{BYTE_INVITE}</span>
              <span className="invite__typed" data-invite-typed="" />
            </span>
          </p>
        </div>

        <form
          className="invite__form"
          action={`mailto:${email}?subject=${encodeURIComponent("[Funfolio] Party invite")}`}
          method="post"
          encType="text/plain"
          data-contact-form=""
          data-invite-form=""
          data-to={email}
        >
          <div className="invite__field">
            <label htmlFor="invite-name" className="invite__label">
              Player name
            </label>
            <input id="invite-name" name="name" type="text" className="invite__input" autoComplete="name" maxLength={NAME_MAX + 40} required aria-describedby="invite-name-err" />
            <p id="invite-name-err" className="invite__err" data-err="name" />
          </div>
          <fieldset className="invite__field invite__quests" aria-describedby="invite-quest-err">
            <legend className="invite__label">Quest type</legend>
            <div className="invite__chips">
              {QUEST_TYPES.map((q, i) => (
                <label key={q} className="quest-chip">
                  <input type="radio" name="quest" value={q} required={i === 0} />
                  <span>{q}</span>
                </label>
              ))}
            </div>
            <p id="invite-quest-err" className="invite__err" data-err="quest" />
          </fieldset>
          <div className="invite__field">
            <label htmlFor="invite-msg" className="invite__label">
              Message
            </label>
            <textarea id="invite-msg" name="message" className="invite__input invite__text" rows={5} maxLength={MESSAGE_MAX + 200} required aria-describedby="invite-msg-err invite-msg-count" />
            <p className="invite__count" id="invite-msg-count" data-needs-js="">
              <span data-invite-count="">0</span> / {MESSAGE_MAX.toLocaleString("en")}
            </p>
            <p id="invite-msg-err" className="invite__err" data-err="message" />
          </div>
          <div className="invite__actions">
            <ArcadeButton type="submit" icon="mail" sfx={false} data-invite-send="">
              Send · Fling it
            </ArcadeButton>
          </div>
        </form>

        {/* after a valid send: the paper plane in its launcher, the mailbox portal across the gap */}
        <div className="launcher" data-launcher="" hidden>
          <p className="launcher__hint" id="launcher-hint">
            Pull the plane back and let go — or press Enter, or Auto-launch.
          </p>
          <div className="launcher__stage" data-launch-stage="">
            <svg className="launcher__arc" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M10 32 Q50 -14 90 26" fill="none" />
            </svg>
            <span className="launcher__posts" aria-hidden="true">
              <span className="launcher__post" />
              <span className="launcher__band" data-launch-band="" />
              <span className="launcher__post" />
            </span>
            <span className="plane" data-plane="" tabIndex={0} role="button" aria-describedby="launcher-hint" aria-label="Paper plane — press Enter to launch it into the mailbox">
              <svg className="plane__svg" viewBox="0 0 32 24" aria-hidden="true">
                <polygon className="plane__body" data-plane-shape="" points={PLANE} />
                <polyline className="plane__fold" points="2,12 10,12 31,12" />
              </svg>
            </span>
            <span className="mailbox" data-mailbox="" aria-hidden="true">
              <span className="mailbox__portal" />
              <span className="mailbox__box">
                <span className="mailbox__slot" />
                <span className="mailbox__flag" data-mailbox-flag="" />
              </span>
            </span>
          </div>
          <div className="launcher__actions" data-launch-actions="">
            <ArcadeButton type="button" icon="bolt" sfx={false} data-launch-auto="">
              Auto-launch ▶
            </ArcadeButton>
            <button type="button" className="lobby-link" data-launch-edit="">
              Back to the message
            </button>
          </div>
        </div>

        <div className="invite__done" data-invite-done="" hidden tabIndex={-1}>
          <p className="invite__ready">
            Message ready <span aria-hidden="true">✉</span> <span className="invite__xp" data-invite-xp="" />
          </p>
          <p className="invite__note">Your email app should open with everything filled in — hit send there. No email app? Copy it instead.</p>
          <div className="invite__done-actions">
            <ArcadeButton href={`mailto:${email}`} icon="mail" sfx={false} data-invite-mailto="">
              Open my email app
            </ArcadeButton>
            <ArcadeButton type="button" variant="secondary" icon="scroll" sfx={false} data-invite-copy="">
              Copy message
            </ArcadeButton>
            <button type="button" className="lobby-link" data-invite-again="">
              Write another
            </button>
          </div>
        </div>
      </PixelFrame>
    </section>
  );
}
