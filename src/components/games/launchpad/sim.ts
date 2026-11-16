// The Launchpad simulation (PART 7): Matter.js world + game rules, no drawing and no DOM. One tick = one
// Engine.update(1000/60). The trajectory preview integrates exactly like Matter does in free flight:
//   v *= 1 − frictionAir;  v.y += g;  p += v        (verified against Matter in Node to 1e-11 px over 120 ticks)

import Matter from "matter-js";
import { ANCHOR, BIG_HIT, BUG_R, BUGS, BYTE_R, COIN, CRATE, FALL, G_TICK, PHYSICS, POP_SPEED, PREVIEW_DOTS, PREVIEW_EVERY, SCORE, SHOTS, TOPPLE, TOPPLE_SHIFT, TOWERS, WORLD } from "./level";

const { Bodies, Body, Composite, Engine, Events } = Matter;

export type Vec = { x: number; y: number };
export type Phase = "aim" | "flying" | "settling" | "over";
export type Mood = "idle" | "scared" | "thrilled" | "dizzy";
export type Crate = { body: Matter.Body; label: string; start: Vec; toppled: boolean };
export type Bug = { body: Matter.Body; startY: number; popped: boolean; seed: number };
export type SimEvents = {
  pop: (at: Vec, points: number) => void;
  topple: (at: Vec, points: number) => void;
  hit: (speed: number, at: Vec) => void;
  coin: (at: Vec) => void;
  launch: () => void;
  shotEnd: (shot: number, popped: number) => void;
  end: (cleared: boolean) => void;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Launch velocity (world units per tick) for an angle (degrees above the horizon) and a power 0…1. */
export function launchVelocity(angle: number, power: number): Vec {
  const a = rad(angle);
  return { x: Math.cos(a) * PHYSICS.vmax * power, y: -Math.sin(a) * PHYSICS.vmax * power };
}
/** Where BYTE sits while pulled back: opposite the launch direction, up to pullMax. */
export function pulledPosition(angle: number, power: number): Vec {
  const a = rad(angle);
  return { x: ANCHOR.x - Math.cos(a) * PHYSICS.pullMax * power, y: ANCHOR.y + Math.sin(a) * PHYSICS.pullMax * power };
}
/** The preview dots: the engine's own free-flight integration, sampled every PREVIEW_EVERY ticks. */
export function previewDots(start: Vec, v0: Vec): Vec[] {
  const p = { ...start };
  const v = { ...v0 };
  const out: Vec[] = [];
  for (let t = 1; out.length < PREVIEW_DOTS; t++) {
    v.x *= 1 - PHYSICS.frictionAir;
    v.y *= 1 - PHYSICS.frictionAir;
    v.y += G_TICK;
    p.x += v.x;
    p.y += v.y;
    if (t % PREVIEW_EVERY === 0) out.push({ ...p });
  }
  return out;
}

export class LaunchpadSim {
  readonly engine: Matter.Engine;
  crates: Crate[] = [];
  bugs: Bug[] = [];
  byte: Matter.Body | null = null;
  coin: Matter.Body | null = null;
  phase: Phase = "aim";
  mood: Mood = "idle";
  shots = SHOTS;
  score = 0;
  angle = 40;
  power = 0.75;
  tick = 0;
  private flightTicks = 0;
  private stillTicks = 0;
  private settleTicks = 0;
  private hitThisShot = false;
  private poppedThisShot = 0;
  private pending: Matter.Body[] = [];
  private on: SimEvents;

  constructor(events: SimEvents, opts: { coinTaken: boolean }) {
    this.on = events;
    this.engine = Engine.create({
      gravity: { x: 0, y: PHYSICS.gravityY, scale: PHYSICS.gravityScale },
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 6,
    });
    this.build(opts.coinTaken);
    Events.on(this.engine, "collisionStart", (e) => e.pairs.forEach((pair) => this.contact(pair)));
  }

  private build(coinTaken: boolean) {
    const world = this.engine.world;
    Composite.clear(world, false);
    this.crates = [];
    this.bugs = [];
    this.byte = null;
    const ground = Bodies.rectangle(WORLD.w / 2, WORLD.groundY + 40, WORLD.w * 3, 80, { isStatic: true, friction: 0.9, label: "ground" });
    Composite.add(world, ground);
    TOWERS.forEach((t) =>
      t.labels.forEach((label, i) => {
        const body = Bodies.rectangle(t.x, WORLD.groundY - CRATE / 2 - i * CRATE, CRATE, CRATE, { chamfer: { radius: 6 }, density: 0.0016, friction: 0.75, frictionStatic: 1.2, restitution: 0.04, label: "crate" });
        this.crates.push({ body, label, start: { x: 0, y: 0 }, toppled: false });
        Composite.add(world, body);
      }),
    );
    BUGS.forEach((b, i) => {
      const x = "tower" in b ? TOWERS[b.tower].x : b.ground;
      const y = "tower" in b ? WORLD.groundY - TOWERS[b.tower].labels.length * CRATE - BUG_R : WORLD.groundY - BUG_R;
      const body = Bodies.circle(x, y, BUG_R, { density: 0.0012, friction: 0.5, restitution: 0.3, label: "bug" });
      this.bugs.push({ body, startY: 0, popped: false, seed: i * 1.7 + 0.4 });
      Composite.add(world, body);
    });
    this.coin = coinTaken ? null : Bodies.circle(COIN.x, COIN.y, COIN.r, { isStatic: true, isSensor: true, label: "coin" });
    if (this.coin) Composite.add(world, this.coin);
    // let the stacks settle before anyone sees them, then remember where everything stands
    for (let i = 0; i < 120; i++) Engine.update(this.engine, PHYSICS.dt);
    this.crates.forEach((c) => {
      c.start = { x: c.body.position.x, y: c.body.position.y };
      c.toppled = false;
    });
    this.bugs.forEach((b) => (b.startY = b.body.position.y));
  }

  reset(coinTaken: boolean) {
    this.build(coinTaken);
    this.phase = "aim";
    this.mood = "idle";
    this.shots = SHOTS;
    this.score = 0;
    this.pending = [];
  }

  get bugsLeft() {
    return this.bugs.filter((b) => !b.popped).length;
  }

  aim(angle: number, power: number) {
    if (this.phase !== "aim") return;
    this.angle = clamp(angle, PHYSICS.minAngle, PHYSICS.maxAngle);
    this.power = clamp(power, 0, 1);
    this.mood = this.power > 0.15 ? "scared" : "idle";
  }

  /** Start position + velocity of the shot as aimed (also what the preview shows). */
  shot() {
    return { start: pulledPosition(this.angle, this.power), v0: launchVelocity(this.angle, this.power) };
  }

  launch(): boolean {
    if (this.phase !== "aim" || this.shots <= 0 || this.power < PHYSICS.minPower) return false;
    const { start, v0 } = this.shot();
    if (this.byte) Composite.remove(this.engine.world, this.byte);
    this.byte = Bodies.circle(start.x, start.y, BYTE_R, { density: 0.0045, friction: 0.35, frictionAir: PHYSICS.frictionAir, restitution: 0.42, label: "byte" });
    Composite.add(this.engine.world, this.byte);
    Body.setVelocity(this.byte, v0);
    this.shots -= 1;
    this.phase = "flying";
    this.mood = "thrilled";
    this.flightTicks = 0;
    this.stillTicks = 0;
    this.hitThisShot = false;
    this.poppedThisShot = 0;
    this.on.launch();
    return true;
  }

  private contact(pair: Matter.Pair) {
    const a = pair.bodyA.parent ?? pair.bodyA;
    const b = pair.bodyB.parent ?? pair.bodyB;
    const labels = [a.label, b.label];
    if (labels.includes("coin")) {
      if (labels.includes("byte") && this.coin) {
        const at = { x: this.coin.position.x, y: this.coin.position.y };
        this.pending.push(this.coin);
        this.coin = null;
        this.on.coin(at);
      }
      return; // a sensor: nothing else happens
    }
    const n = pair.collision.normal;
    const speed = Math.abs((a.velocity.x - b.velocity.x) * n.x + (a.velocity.y - b.velocity.y) * n.y);
    for (const body of [a, b]) {
      const bug = this.bugs.find((x) => x.body === body && !x.popped);
      if (bug && speed > POP_SPEED) this.pop(bug);
    }
    if (labels.includes("byte")) {
      if (labels.some((l) => l !== "byte" && l !== "ground") || speed > 3) {
        this.hitThisShot = true;
        this.mood = "dizzy";
      }
      if (speed > 2.5) {
        const byte = a.label === "byte" ? a : b;
        this.on.hit(speed, { x: byte.position.x, y: byte.position.y });
      }
    } else if (speed > BIG_HIT) {
      this.on.hit(speed * 0.7, { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 });
    }
  }

  private pop(bug: Bug) {
    bug.popped = true;
    this.pending.push(bug.body);
    this.score += SCORE.bug;
    this.poppedThisShot += 1;
    this.on.pop({ x: bug.body.position.x, y: bug.body.position.y }, SCORE.bug);
  }

  private outOfStage(p: Vec) {
    return p.x < -120 || p.x > WORLD.w + 120 || p.y > WORLD.h + 140;
  }

  /** One fixed step. */
  step() {
    Engine.update(this.engine, PHYSICS.dt);
    this.tick += 1;
    if (this.pending.length) {
      Composite.remove(this.engine.world, this.pending);
      this.pending = [];
    }
    for (const bug of this.bugs) {
      if (bug.popped) continue;
      if (bug.body.position.y > bug.startY + FALL || this.outOfStage(bug.body.position)) this.pop(bug);
    }
    for (const c of this.crates) {
      if (c.toppled) continue;
      const shift = Math.hypot(c.body.position.x - c.start.x, c.body.position.y - c.start.y);
      if (Math.abs(c.body.angle) > TOPPLE || shift > TOPPLE_SHIFT) {
        c.toppled = true;
        this.score += SCORE.crate;
        this.on.topple({ x: c.body.position.x, y: c.body.position.y }, SCORE.crate);
      }
    }
    if (this.phase === "flying" && this.byte) {
      this.flightTicks += 1;
      const speed = Math.hypot(this.byte.velocity.x, this.byte.velocity.y);
      this.stillTicks = speed < 0.25 ? this.stillTicks + 1 : 0;
      if (this.stillTicks > 45 || this.outOfStage(this.byte.position) || this.flightTicks > 60 * 7) {
        this.phase = "settling";
        this.settleTicks = 0;
        if (!this.hitThisShot) this.mood = "idle";
        this.on.shotEnd(3 - this.shots, this.poppedThisShot);
      }
    }
    if (this.phase === "settling") {
      this.settleTicks += 1;
      const busy = this.engine.world.bodies.some((b) => !b.isStatic && !b.isSleeping && Math.hypot(b.velocity.x, b.velocity.y) > 0.08);
      if ((this.settleTicks > 30 && !busy) || this.settleTicks > 90) {
        if (this.bugsLeft === 0) this.finish(true);
        else if (this.shots === 0) this.finish(false);
        else {
          // the next BYTE waits in the launcher: the spent one leaves the world (no invisible obstacle)
          if (this.byte) Composite.remove(this.engine.world, this.byte);
          this.byte = null;
          this.phase = "aim";
          this.mood = "idle";
        }
      }
    }
    if (this.bugsLeft === 0 && this.phase === "flying") {
      // every bug down mid-flight: let the dust settle, then celebrate
      this.phase = "settling";
      this.settleTicks = 40;
    }
  }

  private finish(cleared: boolean) {
    this.phase = "over";
    this.on.end(cleared);
  }

  /** Bodies are still moving (or something is mid-air): keep stepping every frame. */
  get busy() {
    return this.phase === "flying" || this.phase === "settling" || this.engine.world.bodies.some((b) => !b.isStatic && !b.isSleeping && Math.hypot(b.velocity.x, b.velocity.y) > 0.05);
  }
}
