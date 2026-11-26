// A cartridge on the Vault's shelf (PART 10): an original CSS-3D cartridge (front label, side, top ridge, grip lines)
// — a real button (Enter inserts it) whose label art is decorative; the sticker label keeps the PART 4 peel secrets.

import type { CSSProperties, ReactNode } from "react";
import type { Cartridge } from "@/content/vault";
import { Peel } from "@/components/ui/Peel";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { TiltSurface } from "@/components/ui/TiltSurface";

export function CartridgeItem({ cart, secret, first }: { cart: Cartridge; secret: ReactNode; first: boolean }) {
  const p = cart.project;
  return (
    <TiltSurface as="li" max={10} className="cart-slot" data-cart-slot={cart.id} data-category={cart.category} style={{ "--from": cart.from, "--to": cart.to } as CSSProperties}>
      <div className="cart" data-flip-id={`cart-${cart.id}`}>
        {/* The name is the label's own words (WCAG 2.5.3, visible title first): "ResearchX — insert cartridge.
            Genre: Multi-Agent RAG". The monogram, foil and dots are decoration. */}
        <button type="button" className="cart__btn" data-cart-btn={cart.id} tabIndex={first ? 0 : -1} data-cursor-label="INSERT" data-primary="">
          <span className="cart__shell">
            <span className="cart__ridge" aria-hidden="true" />
            <span className="cart__label" data-pattern={cart.pattern}>
              <span className="cart__holo" aria-hidden="true" />
              <span className="cart__code" aria-hidden="true">
                {cart.code}
              </span>
              <span className="cart__title">{p.title}</span>
              <span className="sr-only">{" — insert cartridge. "}</span>
              <span className="cart__genre">Genre: {p.genre}</span>
              <span className="cart__dots" aria-hidden="true">
                {cart.dots.slice(0, 12).map((d, i) => (
                  <span key={i} className="cart__dot" data-tone={d.tone ?? undefined} />
                ))}
              </span>
            </span>
            <span className="cart__grip" aria-hidden="true" />
          </span>
          <span className="cart__side" aria-hidden="true" />
          <span className="cart__top" aria-hidden="true" />
        </button>
        <Peel label={`Peek under the ${p.title} label`}>{secret}</Peel>
      </div>
    </TiltSurface>
  );
}

/** "LOCKED — next project loading…": chained and padlocked; blow on it 5× → coin #8. */
export function LockedCartridge() {
  return (
    <li className="cart-slot cart-slot--locked" data-cart-slot="locked" data-category="locked">
      <div className="cart">
        <button type="button" className="cart__btn" data-cart-locked="" tabIndex={-1}>
          <span className="cart__shell">
            <span className="cart__ridge" aria-hidden="true" />
            <span className="cart__label cart__label--locked">
              <span className="cart__chains" aria-hidden="true" />
              <span className="cart__lock" aria-hidden="true">
                <PixelIcon name="lock" size={32} />
              </span>
              <span className="cart__title">Locked</span>
              <span className="sr-only">{" cartridge: "}</span>
              <span className="cart__genre">Next project loading…</span>
              <span className="sr-only">{" Blow the dust off it."}</span>
            </span>
            <span className="cart__grip" aria-hidden="true" />
          </span>
          <span className="cart__side" aria-hidden="true" />
          <span className="cart__top" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
