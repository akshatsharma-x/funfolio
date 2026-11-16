"use client";
/* eslint-disable react-hooks/immutability -- three.js scene objects (materials, fog, instance matrices, groups) are
   mutable by design: they are only mutated in useFrame callbacks and effects, never during render, and this project
   doesn't compile with the React Compiler. Randomness is seeded (pure) on purpose. */

// The hero 3D overworld island (PART 5) — lazy, client-only. Procedural from primitives and instanced voxels (no
// assets, no network — R10): toon materials + drei <Outlines/>, one key light + ambient, blob shadows.
// Landmarks are driven by the HTML hotspot buttons (keyboard + screen readers); this scene only renders, hops, glows,
// swoops the camera and projects the hotspots onto the landmarks. The wheel always scrolls the page (rotate-only
// controls, no zoom). Renders only while on screen and not paused; on demand under reduced motion.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Outlines, PerformanceMonitor, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { LANDMARKS, type Landmark, type LandmarkId } from "@/content/landmarks";
import { command } from "@/lib/commands";
import { heroLoad } from "@/lib/heroLoad";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { island } from "@/lib/island";
import { dropQualityTier } from "@/lib/quality";
import { useSave } from "@/lib/store";
import { buildIsland, type IslandModel } from "./islandModel";

// R3F 9.8 (the latest stable) still creates a THREE.Clock, which three r183+ reports as deprecated on every page
// load. Drop exactly that message (R3F 10 moves to THREE.Timer); everything else three logs goes to the console.
{
  const previous = THREE.getConsoleFunction();
  THREE.setConsoleFunction((type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock: This module has been deprecated")) return;
    if (previous) return previous(type, message, ...params);
    const out = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
    const trace = params[0] as { isStackTrace?: boolean; getError?: (m: string) => unknown } | undefined;
    if (trace?.isStackTrace && trace.getError) out(trace.getError(message));
    else out(message, ...params);
  });
}

const INK = "#07060F";
const CREAM = "#FFF4E0";
// far enough that the whole floating island (rock tip included) fits, slightly isometric
const CAMERA_HOME = new THREE.Vector3(24.5, 13, 30);
const TARGET_HOME = new THREE.Vector3(0, -0.4, 0);
const CAMERA_AZIMUTH = Math.atan2(CAMERA_HOME.z, CAMERA_HOME.x);

export type IslandCanvasProps = {
  tier: "high" | "low";
  /** Rendering at all (on screen, not paused). */
  running: boolean;
  /** No idle animation: render on demand (reduced motion). */
  still: boolean;
  /** Drag-to-rotate (fine pointers only — on touch the page must keep scrolling). */
  rotate: boolean;
  /** Horizontal framing: the island sits right of centre when the canvas spans the whole Title Screen. */
  offsetX: number;
  hotspots: HTMLElement | null;
  onReady: () => void;
};

/** Seeded PRNG (mulberry32) — the island looks the same on every visit, and render stays pure. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── shared materials (module scope: one toon material per color, one 3-step gradient) ──────────────────────────
let gradient: THREE.DataTexture | null = null;
const toonCache = new Map<string, THREE.MeshToonMaterial>();
function toonMaterial(color: string, emissive?: string, emissiveIntensity = 0): THREE.MeshToonMaterial {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([88, 168, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    gradient.needsUpdate = true;
  }
  const key = `${color}|${emissive ?? ""}|${emissiveIntensity}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
      m.emissiveIntensity = emissiveIntensity;
    }
    toonCache.set(key, m);
  }
  return m;
}
const useToon = () => toonMaterial;
type Toon = typeof toonMaterial;

function useHovered(id: LandmarkId) {
  const [on, setOn] = useState(() => island.get().hovered === id);
  useEffect(() => island.subscribe(() => setOn(island.get().hovered === id)), [id]);
  return on;
}

/** A mesh with the ink toon outline (glows in the world color while hovered). */
function Block({ args, position, rotation, material, outline = true, hover, glow, geometry = "box", children }: {
  args: number[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  outline?: boolean;
  hover?: boolean;
  glow?: string;
  geometry?: "box" | "cyl" | "cone" | "sphere";
  children?: ReactNode;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      {geometry === "box" ? <boxGeometry args={args as [number, number, number]} /> : null}
      {geometry === "cyl" ? <cylinderGeometry args={args as [number, number, number, number]} /> : null}
      {geometry === "cone" ? <coneGeometry args={args as [number, number, number]} /> : null}
      {geometry === "sphere" ? <sphereGeometry args={args as [number, number, number, number, number, number, number]} /> : null}
      {outline ? <Outlines thickness={hover ? 0.07 : 0.035} color={hover && glow ? glow : INK} /> : null}
      {children}
    </mesh>
  );
}

// ── sky + stars ─────────────────────────────────────────────────────────────────────────────────────────────────
function Sky({ night }: { night: boolean }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float t = smoothstep(-0.3, 0.7, vP.y); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }",
      }),
    [],
  );
  useEffect(() => {
    // pale enough behind the HTML text that every line keeps WCAG AA contrast in both themes
    mat.uniforms.top.value.set(night ? "#120B2E" : "#DDF6FF");
    mat.uniforms.bottom.value.set(night ? "#2A1D5E" : "#FFE3F0");
  }, [mat, night]);
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[95, 24, 16]} />
    </mesh>
  );
}

function Stars({ still }: { still: boolean }) {
  const groups = useMemo(
    () =>
      [0, 1, 2].map((g) => {
        const rand = seeded(101 + g);
        const pos = new Float32Array(70 * 3);
        for (let i = 0; i < 70; i++) {
          const theta = rand() * Math.PI * 2;
          const phi = rand() * 0.9 + 0.05;
          pos[i * 3] = Math.cos(theta) * Math.sin(phi) * 80;
          pos[i * 3 + 1] = Math.cos(phi) * 80 * 0.8 + 6;
          pos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * 80;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: g === 2 ? "#FFD23F" : CREAM, size: g === 0 ? 3 : 2, sizeAttenuation: false, transparent: true, fog: false });
        return { geo, mat, phase: g * 2.1 };
      }),
    [],
  );
  useFrame(({ clock }) => {
    if (still) return;
    for (const g of groups) g.mat.opacity = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 1.3 + g.phase);
  });
  return (
    <>
      {groups.map((g, i) => (
        <points key={i} geometry={g.geo} material={g.mat} />
      ))}
    </>
  );
}

// ── terrain ─────────────────────────────────────────────────────────────────────────────────────────────────────
function Terrain({ model, toon }: { model: IslandModel; toon: Toon }) {
  const caps = useRef<THREE.InstancedMesh>(null);
  const cols = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const white = useMemo(() => toon("#FFFFFF"), [toon]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    const size = model.cell * 0.98;
    model.cells.forEach((cell, i) => {
      const colH = cell.h - 0.25 + 0.9;
      m.compose(p.set(cell.x, -0.9 + colH / 2, cell.z), q, s.set(size, colH, size));
      cols.current?.setMatrixAt(i, m);
      cols.current?.setColorAt(i, c.set(i % 3 ? "#8C5A33" : "#7A4C2A"));
      m.compose(p.set(cell.x, cell.h - 0.125, cell.z), q, s.set(size, 0.25, size));
      caps.current?.setMatrixAt(i, m);
      const tint = ((i * 7919) % 5) / 5;
      caps.current?.setColorAt(i, c.set("#6FD46B").offsetHSL(tint * 0.03 - 0.015, 0, tint * 0.08 - 0.04));
    });
    model.taper.forEach((t, i) => {
      m.compose(p.set(t.x, t.y, t.z), q, s.set(size, 0.85, size));
      rocks.current?.setMatrixAt(i, m);
      rocks.current?.setColorAt(i, c.set(i % 9 === 0 ? "#8E8AA8" : "#6B4429").offsetHSL(0, 0, -t.depth * 0.18));
    });
    for (const r of [caps, cols, rocks]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, [model]);
  return (
    <group>
      <instancedMesh ref={cols} args={[undefined, undefined, model.cells.length]} material={white}>
        <boxGeometry />
        <Outlines thickness={0.03} color={INK} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, model.cells.length]} material={white}>
        <boxGeometry />
        <Outlines thickness={0.03} color={INK} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, model.taper.length]} material={white}>
        <boxGeometry />
        <Outlines thickness={0.03} color={INK} />
      </instancedMesh>
    </group>
  );
}

function Waterfall({ model, toon, still, count }: { model: IslandModel; toon: Toon; still: boolean; count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, (_, i) => ({ phase: i / count, jx: (rand() - 0.5) * 0.9, jz: (rand() - 0.5) * 0.5, s: 0.2 + rand() * 0.18 }));
  }, [count]);
  const mat = useMemo(() => toon("#7FE7F7", "#22D3EE", 0.25), [toon]);
  const dir = useMemo(() => new THREE.Vector2(model.edge.x, model.edge.z).normalize(), [model]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = still ? 0.3 : clock.elapsedTime;
    seeds.forEach((sd, i) => {
      const f = (t * 0.45 + sd.phase) % 1;
      const out = 0.6 + f * 1.1;
      const x = model.edge.x + dir.x * out + sd.jx * dir.y;
      const z = model.edge.z + dir.y * out - sd.jx * dir.x + sd.jz;
      const y = model.edge.h - f * f * 9;
      m.makeScale(sd.s, sd.s * 1.6, sd.s).setPosition(x, y, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mat} frustumCulled={false}>
      <boxGeometry />
    </instancedMesh>
  );
}

function Clouds({ toon, still, count }: { toon: Toon; still: boolean; count: number }) {
  const ref = useRef<THREE.Group>(null);
  // clouds drift on the far side of the island only — never between the camera and the text
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: CAMERA_AZIMUTH + Math.PI + 0.25 + (count > 1 ? (i / (count - 1) - 0.5) * 1.5 : 0),
        r: 15 + (i % 3) * 2,
        y: 6.5 + (i % 2) * 2.5,
        puffs: Array.from({ length: 4 + (i % 3) }, (_, k) => [k * 1.1 - 1.6, (k % 2) * 0.6, (k % 3) * 0.5 - 0.4, 1 + (k % 2) * 0.5] as const),
      })),
    [count],
  );
  const mat = useMemo(() => toon(CREAM), [toon]);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || still) return;
    g.children.forEach((child, i) => {
      const c = clouds[i];
      const a = c.angle + Math.sin(clock.elapsedTime * 0.05 + i * 1.7) * 0.18; // a slow back-and-forth drift
      child.position.set(Math.cos(a) * c.r, c.y, Math.sin(a) * c.r);
    });
  });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[Math.cos(c.angle) * c.r, c.y, Math.sin(c.angle) * c.r]}>
          {c.puffs.map(([x, y, z, s], k) => (
            <mesh key={k} position={[x, y, z]} material={mat}>
              <boxGeometry args={[s * 1.3, s * 0.8, s]} />
              <Outlines thickness={0.03} color={INK} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── landmarks ───────────────────────────────────────────────────────────────────────────────────────────────────
type LandmarkArt = (p: { l: Landmark; toon: Toon; hover: boolean; still: boolean }) => ReactNode;

const ANCHOR: Record<LandmarkId, number> = { house: 2.6, tower: 4.6, observatory: 2.9, workshop: 3.1, arcade: 2.6, tree: 3.6, pedestal: 2.4, radio: 4.8 };

function House({ l, toon, hover }: Parameters<LandmarkArt>[0]) {
  return (
    <group>
      <Block args={[1.7, 1.2, 1.5]} position={[0, 0.6, 0]} material={toon(l.color)} hover={hover} glow={l.color} />
      <mesh position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]} material={toon("#0E7490")}>
        <coneGeometry args={[1.35, 0.9, 4]} />
        <Outlines thickness={hover ? 0.07 : 0.035} color={hover ? l.color : INK} />
      </mesh>
      <Block args={[0.4, 0.6, 0.05]} position={[0, 0.3, 0.77]} material={toon(INK)} outline={false} />
      <Block args={[0.35, 0.3, 0.05]} position={[0.5, 0.75, 0.77]} material={toon("#FFD23F", "#FFD23F", 0.6)} outline={false} />
    </group>
  );
}

function Tower({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const top = useRef<THREE.MeshToonMaterial>(null);
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (still) return;
    if (top.current) top.current.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.35;
  });
  return (
    <group>
      {[0, 1, 2].map((f) => (
        <Block key={f} args={[1.45 - f * 0.12, 0.85, 1.45 - f * 0.12]} position={[0, 0.43 + f * 0.86, 0]} material={toon(f % 2 ? "#8BD62E" : l.color)} hover={hover} glow={l.color} />
      ))}
      <mesh position={[0, 3.03, 0]}>
        <boxGeometry args={[1.05, 0.85, 1.05]} />
        <meshToonMaterial ref={top} color={l.color} emissive={l.color} emissiveIntensity={0.6} />
        <Outlines thickness={hover ? 0.07 : 0.035} color={hover ? l.color : INK} />
      </mesh>
      <Block args={[0.06, 0.9, 0.06]} position={[0, 3.9, 0]} material={toon(INK)} outline={false} />
      <mesh ref={flag} position={[0.22, 4.2, 0]} material={toon("#FF3D8B")}>
        <boxGeometry args={[0.42, 0.26, 0.04]} />
      </mesh>
    </group>
  );
}

function Observatory({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const dish = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!still && dish.current) dish.current.rotation.y += dt * 0.6;
  });
  return (
    <group>
      <Block geometry="cyl" args={[0.95, 1.05, 1, 12]} position={[0, 0.5, 0]} material={toon(CREAM)} hover={hover} glow={l.color} />
      <Block geometry="sphere" args={[0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 1, 0]} material={toon(l.color)} hover={hover} glow={l.color} />
      <group ref={dish} position={[0, 2, 0]}>
        <Block args={[0.08, 0.5, 0.08]} position={[0, 0.2, 0]} material={toon(INK)} outline={false} />
        <mesh position={[0.15, 0.55, 0]} rotation={[0, 0, -0.9]} material={toon("#DDD6FE")}>
          <coneGeometry args={[0.42, 0.24, 12, 1, true]} />
          <Outlines thickness={0.03} color={INK} />
        </mesh>
      </group>
    </group>
  );
}

function Workshop({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const sign = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!still && sign.current) sign.current.position.y = 2.05 + Math.sin(clock.elapsedTime * 1.6) * 0.06;
  });
  return (
    <group>
      <Block args={[1.9, 1.1, 1.4]} position={[0, 0.55, 0]} material={toon(l.color)} hover={hover} glow={l.color} />
      <Block args={[0.5, 0.65, 0.05]} position={[-0.4, 0.33, 0.72]} material={toon(INK)} outline={false} />
      <group ref={sign} position={[0, 2.05, 0]}>
        <Block args={[1.4, 1.05, 0.22]} material={toon("#9E9AB5")} hover={hover} glow={l.color} />
        <Block args={[1, 0.5, 0.05]} position={[0, 0.12, 0.13]} material={toon(CREAM)} outline={false} />
        <Block args={[0.7, 0.12, 0.05]} position={[0, -0.36, 0.13]} material={toon(INK)} outline={false} />
      </group>
    </group>
  );
}

function ArcadeBox({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const marquee = useRef<THREE.MeshToonMaterial>(null);
  useFrame(({ clock }) => {
    // a gentle flicker (well under 3 flashes per second — R5)
    if (!still && marquee.current) marquee.current.emissiveIntensity = Math.sin(clock.elapsedTime * 7) > 0.85 ? 0.35 : 0.9;
  });
  return (
    <group>
      <Block args={[1.2, 1.5, 1.1]} position={[0, 0.75, 0]} material={toon("#2A1D5E")} hover={hover} glow={l.color} />
      <mesh position={[0, 1.7, 0.1]}>
        <boxGeometry args={[1.3, 0.45, 1.2]} />
        <meshToonMaterial ref={marquee} color={l.color} emissive={l.color} emissiveIntensity={0.9} />
        <Outlines thickness={hover ? 0.07 : 0.035} color={hover ? l.color : INK} />
      </mesh>
      <Block args={[0.8, 0.55, 0.05]} position={[0, 1, 0.57]} material={toon("#22D3EE", "#22D3EE", 0.5)} outline={false} />
    </group>
  );
}

function SkillTree({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const fruit = useRef<THREE.MeshToonMaterial>(null);
  useFrame(({ clock }) => {
    if (!still && fruit.current) fruit.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2.6) * 0.35;
  });
  const leaves: [number, number, number][] = [[0, 2.3, 0], [0.7, 2, 0.2], [-0.7, 2, -0.1], [0.2, 2.1, 0.7], [-0.2, 2.2, -0.7], [0, 2.95, 0.1], [0.5, 2.7, -0.4], [-0.5, 2.75, 0.4]];
  const fruits: [number, number, number][] = [[0.75, 2.3, 0.65], [-0.8, 2.5, 0.3], [0.3, 3.3, -0.4], [-0.3, 1.8, -0.9]];
  return (
    <group>
      <Block args={[0.4, 1.7, 0.4]} position={[0, 0.85, 0]} material={toon("#7A4C2A")} hover={hover} glow={l.color} />
      {leaves.map((p, i) => (
        <Block key={i} args={[0.85, 0.75, 0.85]} position={p} material={toon(i % 2 ? "#B6E34A" : "#8BD62E")} hover={hover} glow={l.color} />
      ))}
      {fruits.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshToonMaterial ref={i === 0 ? fruit : undefined} color={l.color} emissive={l.color} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Pedestal({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const cup = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!still && cup.current) cup.current.rotation.y += dt * 1.1;
  });
  const gold = toon("#FFC83D", "#C98A00", 0.25);
  return (
    <group>
      <Block args={[1, 0.9, 1]} position={[0, 0.45, 0]} material={toon(l.color)} hover={hover} glow={l.color} />
      <group ref={cup} position={[0, 0.9, 0]}>
        <Block geometry="cyl" args={[0.18, 0.28, 0.14, 10]} position={[0, 0.07, 0]} material={gold} />
        <Block geometry="cyl" args={[0.07, 0.07, 0.4, 8]} position={[0, 0.34, 0]} material={gold} outline={false} />
        <Block geometry="cyl" args={[0.42, 0.16, 0.6, 12]} position={[0, 0.8, 0]} material={gold} hover={hover} glow={l.color} />
        <Block args={[0.14, 0.32, 0.08]} position={[0.5, 0.82, 0]} material={gold} outline={false} />
        <Block args={[0.14, 0.32, 0.08]} position={[-0.5, 0.82, 0]} material={gold} outline={false} />
      </group>
    </group>
  );
}

function Radio({ l, toon, hover, still }: Parameters<LandmarkArt>[0]) {
  const rings = useRef<THREE.Group>(null);
  const ringMats = useMemo(() => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: l.color, transparent: true })), [l.color]);
  useFrame(({ clock }) => {
    const g = rings.current;
    if (!g) return;
    g.children.forEach((ring, i) => {
      const f = still ? 0.4 + i * 0.2 : (clock.elapsedTime * 0.5 + i / 3) % 1;
      ring.scale.setScalar(0.3 + f * 1.6);
      ringMats[i].opacity = 1 - f;
    });
  });
  const legs: [number, number][] = [[0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]];
  return (
    <group>
      {legs.map(([x, z], i) => (
        <Block key={i} args={[0.12, 3.4, 0.12]} position={[x * 0.6, 1.7, z * 0.6]} rotation={[z * 0.12, 0, -x * 0.12]} material={toon(CREAM)} hover={hover} glow={l.color} />
      ))}
      {[0.9, 1.9, 2.8].map((y) => (
        <Block key={y} args={[0.75 - y * 0.12, 0.08, 0.75 - y * 0.12]} position={[0, y, 0]} material={toon(l.color)} outline={false} />
      ))}
      <Block geometry="sphere" args={[0.18, 10, 8]} position={[0, 3.6, 0]} material={toon(l.color, l.color, 0.8)} hover={hover} glow={l.color} />
      <group ref={rings} position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {ringMats.map((m, i) => (
          <mesh key={i} material={m}>
            <torusGeometry args={[0.6, 0.04, 6, 28]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const ART: Record<LandmarkId, LandmarkArt> = {
  house: House,
  tower: Tower,
  observatory: Observatory,
  workshop: Workshop,
  arcade: ArcadeBox,
  tree: SkillTree,
  pedestal: Pedestal,
  radio: Radio,
};

function LandmarkSpot({ l, model, toon, still, anchors, shadows }: { l: Landmark; model: IslandModel; toon: Toon; still: boolean; anchors: Map<string, THREE.Object3D>; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Object3D>(null);
  const hover = useHovered(l.id);
  const base = model.heightAt(l.at[0], l.at[1]);
  const Art = ART[l.id];
  useEffect(() => {
    if (anchor.current) anchors.set(l.id, anchor.current);
    return () => {
      anchors.delete(l.id);
    };
  }, [anchors, l.id]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = hover ? 0.55 : 0;
    g.position.y += (target - g.position.y) * Math.min(1, dt * 14);
  });
  const shadow = useMemo(() => new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.28, depthWrite: false }), []);
  return (
    <group position={[l.at[0], base, l.at[1]]}>
      {shadows ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={shadow}>
          <circleGeometry args={[1.15, 18]} />
        </mesh>
      ) : null}
      <group ref={ref}>
        <Art l={l} toon={toon} hover={hover} still={still} />
        <object3D ref={anchor} position={[0, ANCHOR[l.id], 0]} />
      </group>
    </group>
  );
}

// ── life: plane, BYTE, the hidden coin ──────────────────────────────────────────────────────────────────────────
function Plane({ toon, still, anchors }: { toon: Toon; still: boolean; anchors: Map<string, THREE.Object3D> }) {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const prop = useRef<THREE.Mesh>(null);
  const loop = useRef<number | null>(null);
  useEffect(() => {
    let clicks = 0;
    island.onPlane(() => {
      clicks += 1;
      if (clicks >= 3) {
        clicks = 0;
        loop.current = performance.now();
        command({ type: "achievement", id: "frequent-flyer" });
      }
    });
    if (ref.current) anchors.set("plane", ref.current);
    return () => {
      island.onPlane(null);
      anchors.delete("plane");
    };
  }, [anchors]);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g || !body.current) return;
    const t = still ? 0.8 : clock.elapsedTime * 0.3;
    const r = 11.5;
    g.position.set(Math.cos(t) * r, 6.6 + Math.sin(t * 2) * 0.35, Math.sin(t) * r);
    g.rotation.set(0, -t, 0.22);
    let pitch = 0;
    let lift = 0;
    if (loop.current !== null) {
      const p = (performance.now() - loop.current) / 1700;
      if (p >= 1) loop.current = null;
      else {
        pitch = p * Math.PI * 2; // loop-de-loop
        lift = Math.sin(p * Math.PI) * 2.4;
      }
    }
    body.current.rotation.x = pitch;
    body.current.position.y = lift;
    if (prop.current && !still) prop.current.rotation.x += dt * 30;
  });
  return (
    <group ref={ref}>
      <group ref={body}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <Block args={[0.34, 0.34, 1.5]} material={toon(CREAM)} />
          <Block args={[1.7, 0.07, 0.42]} position={[0, 0.05, 0.1]} material={toon("#FF4D4D")} />
          <Block args={[0.62, 0.06, 0.24]} position={[0, 0.08, -0.62]} material={toon("#FF4D4D")} />
          <Block args={[0.06, 0.32, 0.24]} position={[0, 0.25, -0.62]} material={toon("#FF4D4D")} />
          <mesh ref={prop} position={[0, 0, 0.8]} material={toon(INK)}>
            <boxGeometry args={[0.05, 0.7, 0.08]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Byte3D({ model, toon, still }: { model: IslandModel; toon: Toon; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const house = LANDMARKS.find((l) => l.id === "house")!;
  const x = house.at[0] + 1.6;
  const z = house.at[1] + 1.2;
  const y0 = model.heightAt(x, z) + 1.2;
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.position.y = y0 + Math.sin(clock.elapsedTime * 2.6) * 0.18;
  });
  return (
    <group ref={ref} position={[x, y0, z]} rotation={[0, 0.5, 0]}>
      <Block args={[0.8, 0.62, 0.5]} material={toon(CREAM)} />
      <Block args={[0.62, 0.42, 0.05]} position={[0, 0, 0.26]} material={toon(INK)} outline={false} />
      <Block args={[0.1, 0.16, 0.05]} position={[-0.14, 0.02, 0.29]} material={toon("#FFC83D", "#FFC83D", 0.9)} outline={false} />
      <Block args={[0.1, 0.16, 0.05]} position={[0.14, 0.02, 0.29]} material={toon("#FFC83D", "#FFC83D", 0.9)} outline={false} />
      <Block args={[0.04, 0.3, 0.04]} position={[0, 0.46, 0]} material={toon(INK)} outline={false} />
      <Block geometry="sphere" args={[0.09, 8, 6]} position={[0, 0.64, 0]} material={toon("#FFC83D", "#FFC83D", 0.9)} outline={false} />
      <Block args={[0.42, 0.24, 0.3]} position={[0, -0.48, 0]} material={toon(CREAM)} />
    </group>
  );
}

function HiddenCoin({ model, toon, still, anchors }: { model: IslandModel; toon: Toon; still: boolean; anchors: Map<string, THREE.Object3D> }) {
  const ref = useRef<THREE.Group>(null);
  const collected = useSave((s) => s.player.coinIds.includes("quest-tower"));
  const tower = LANDMARKS.find((l) => l.id === "tower")!;
  // directly behind the tower as seen from the default camera
  const away = new THREE.Vector2(-CAMERA_HOME.x, -CAMERA_HOME.z).normalize().multiplyScalar(1.5);
  const x = tower.at[0] + away.x;
  const z = tower.at[1] + away.y;
  const y = model.heightAt(x, z) + 1.1;
  useEffect(() => {
    if (ref.current && !collected) anchors.set("coin", ref.current);
    return () => {
      anchors.delete("coin");
    };
  }, [anchors, collected]);
  useFrame((_, dt) => {
    if (ref.current && !still) ref.current.rotation.y += dt * 2.4;
  });
  if (collected) return null;
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={toon("#FFC83D", "#C98A00", 0.35)}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 18]} />
        <Outlines thickness={0.04} color={INK} />
      </mesh>
    </group>
  );
}

// ── camera rig: framing, parallax, spin, swoop, dive, hotspot projection ────────────────────────────────────────
function Rig({ offsetX, still, rotate, hotspots, world, diveGroup, onFirstFrame }: { offsetX: number; still: boolean; rotate: boolean; hotspots: HTMLElement | null; world: RefObject<THREE.Group | null>; diveGroup: RefObject<THREE.Group | null>; onFirstFrame: () => void }) {
  const { camera, size, scene, invalidate } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const anchorsRef = useAnchors();
  const pointer = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const swooping = useRef(false);
  const frames = useRef(0);
  const fog = useMemo(() => new THREE.Fog("#FFF4E0", 200, 400), []);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.setViewOffset(size.width, size.height, -offsetX * size.width, 0, size.width, size.height);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size, offsetX, invalidate]);

  // Touch-first devices get no orbit at all: OrbitControls sets touch-action: none on the canvas wrapper, which would
  // swallow the swipes that scroll the page. With a mouse it rotates; a touchscreen laptop keeps vertical swipes (pan-y).
  useLayoutEffect(() => {
    if (!rotate) camera.lookAt(TARGET_HOME);
  }, [camera, rotate]);
  useEffect(() => {
    const el = controls.current?.domElement;
    if (el) el.style.touchAction = "pan-y";
  }, [rotate]);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
      if (still) invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const offIsland = island.subscribe(() => invalidate());
    // swoop toward a landmark (GSAP — its ticker sleeps again when the tween is done)
    island.onGo(async (id) => {
      const anchor = anchorsRef.get(id);
      if (!anchor || still) return;
      swooping.current = true;
      if (controls.current) controls.current.enabled = false;
      const { gsap } = await import("gsap");
      const to = new THREE.Vector3();
      anchor.getWorldPosition(to);
      const fromPos = camera.position.clone();
      const fromTarget = controls.current ? controls.current.target.clone() : TARGET_HOME.clone();
      const dir = fromPos.clone().sub(to).normalize();
      const endPos = to.clone().add(dir.multiplyScalar(7)).add(new THREE.Vector3(0, 1.5, 0));
      const proxy = { t: 0 };
      await new Promise<void>((resolve) => {
        gsap.to(proxy, {
          t: 1,
          duration: 0.75,
          ease: "expo.inOut",
          onUpdate: () => {
            camera.position.lerpVectors(fromPos, endPos, proxy.t);
            const target = fromTarget.clone().lerp(to, proxy.t);
            controls.current?.target.copy(target);
            camera.lookAt(target);
            invalidate();
          },
          onComplete: () => resolve(),
        });
      });
      // come back home quietly once the page has scrolled away
      window.setTimeout(() => {
        camera.position.copy(CAMERA_HOME);
        if (controls.current) {
          controls.current.target.copy(TARGET_HOME);
          controls.current.update();
          controls.current.enabled = true;
        } else camera.lookAt(TARGET_HOME);
        swooping.current = false;
        invalidate();
      }, 1400);
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      offIsland();
      island.onGo(null);
    };
  }, [camera, invalidate, still, rotate, anchorsRef]);

  // unmounting (far away, a lower tier): hand the buttons back to the SVG island's static layout
  useEffect(
    () => () => {
      for (const el of hotspots?.querySelectorAll<HTMLElement>("[data-hotspot]") ?? []) {
        el.style.translate = "";
        el.removeAttribute("data-off");
        delete el.dataset.edgeLive;
      }
    },
    [hotspots],
  );

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const w = world.current;
    // spin to peek behind the Quest Tower + ≤ 3° pointer parallax
    const wantSpin = island.get().spun ? Math.PI : 0;
    spin.current += (wantSpin - spin.current) * Math.min(1, dt * (still ? 60 : 3));
    if (w) {
      const px = still ? 0 : pointer.current.x * 0.052; // 3°
      const py = still ? 0 : pointer.current.y * 0.026;
      w.rotation.y += (spin.current + px - w.rotation.y) * Math.min(1, dt * 6);
      w.rotation.x += (py - w.rotation.x) * Math.min(1, dt * 6);
    }
    // scroll-out dive: the world rises past the camera = the camera dives down through the clouds (fog → cream)
    const dive = still ? 0 : island.get().dive;
    if (!swooping.current) {
      const cam = camera as THREE.PerspectiveCamera;
      const fovTarget = 35 + dive * 18;
      if (Math.abs(cam.fov - fovTarget) > 0.01) {
        cam.fov = fovTarget;
        cam.updateProjectionMatrix();
      }
      if (diveGroup.current) diveGroup.current.position.y = dive * 10;
      fog.near = 200 - dive * 190;
      fog.far = 400 - dive * 378;
    }
    // project the hotspots onto their landmarks / the plane / the coin
    if (hotspots) {
      for (const el of hotspots.querySelectorAll<HTMLElement>("[data-hotspot]")) {
        const a = anchorsRef.get(el.dataset.hotspot ?? "");
        if (!a) {
          el.toggleAttribute("data-off", true);
          continue;
        }
        a.getWorldPosition(v);
        let hidden = false;
        if (el.dataset.hotspot === "coin") {
          // only when the tower no longer hides it
          const tower = anchorsRef.get("tower");
          if (tower) {
            const t = new THREE.Vector3();
            tower.getWorldPosition(t);
            const toCoin = new THREE.Vector2(v.x - t.x, v.z - t.z).normalize();
            const toCam = new THREE.Vector2(state.camera.position.x - t.x, state.camera.position.z - t.z).normalize();
            hidden = toCoin.dot(toCam) < 0.1;
          }
        }
        v.project(state.camera);
        const x = (v.x * 0.5 + 0.5) * size.width;
        const y = (-v.y * 0.5 + 0.5) * size.height;
        // the circling plane's button hides while it crosses the text column (it would steal clicks and hovers)
        if (el.dataset.hotspot === "plane" && x < island.get().textRight + 28) hidden = true;
        const off = hidden || v.z > 1 || x < -40 || y < -40 || x > size.width + 40 || y > size.height + 40 || dive > 0.35;
        el.toggleAttribute("data-off", off);
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        // labels near the canvas edges anchor to that side (they'd spill off the page otherwise)
        const edge = x > size.width - 190 ? "end" : x < 190 ? "start" : "";
        if ((el.dataset.edgeLive ?? "") !== edge) {
          if (edge) el.dataset.edgeLive = edge;
          else delete el.dataset.edgeLive;
        }
      }
    }
    // ready after a few frames (shaders compiled) — or the first one when rendering on demand
    if (frames.current < 3) {
      frames.current += 1;
      if (frames.current === 3 || still) {
        frames.current = 3;
        onFirstFrame();
      }
    }
  });

  if (!rotate) return null;
  return (
    <OrbitControls
      ref={controls}
      makeDefault={false}
      target={[TARGET_HOME.x, TARGET_HOME.y, TARGET_HOME.z]}
      enableZoom={false}
      enablePan={false}
      enableDamping={!still}
      dampingFactor={0.08}
      rotateSpeed={0.55}
      minPolarAngle={0.75}
      maxPolarAngle={1.25}
      onChange={() => invalidate()}
    />
  );
}

const anchorsContext = new Map<string, THREE.Object3D>();
const useAnchors = () => anchorsContext;

function Scene({ tier, still, rotate, offsetX, hotspots, onReady }: Omit<IslandCanvasProps, "running">) {
  const toon = useToon();
  const theme = useHtmlAttribute("data-theme", "night");
  const night = theme !== "day";
  const model = useMemo(() => buildIsland(tier), [tier]);
  const world = useRef<THREE.Group>(null);
  const diveGroup = useRef<THREE.Group>(null);
  const anchors = useAnchors();
  const { active, progress } = useProgress();
  useEffect(() => {
    if (active) heroLoad.report({ progress: 0.6 + (progress / 100) * 0.35 });
  }, [active, progress]);
  return (
    <>
      <Sky night={night} />
      {night ? <Stars still={still} /> : null}
      <ambientLight intensity={night ? 0.75 : 0.95} color={night ? "#C9C2FF" : "#FFFFFF"} />
      <directionalLight position={[8, 15, 7]} intensity={night ? 1.4 : 1.7} />
      <group ref={diveGroup}>
      <group ref={world}>
        <Terrain model={model} toon={toon} />
        <Waterfall model={model} toon={toon} still={still} count={tier === "high" ? 36 : 18} />
        {LANDMARKS.map((l) => (
          <LandmarkSpot key={l.id} l={l} model={model} toon={toon} still={still} anchors={anchors} shadows={tier === "high"} />
        ))}
        <Byte3D model={model} toon={toon} still={still} />
        <HiddenCoin model={model} toon={toon} still={still} anchors={anchors} />
      </group>
      <Clouds toon={toon} still={still} count={tier === "high" ? 6 : 3} />
      <Plane toon={toon} still={still} anchors={anchors} />
      </group>
      <Rig offsetX={offsetX} still={still} rotate={rotate} hotspots={hotspots} world={world} diveGroup={diveGroup} onFirstFrame={onReady} />
    </>
  );
}

export default function IslandCanvas(props: IslandCanvasProps) {
  const { tier, running, still } = props;
  // "live" lives in the island store: true after the first frames (onReady), false again when this unmounts
  useEffect(() => () => island.set({ live: false }), []);
  const maxDpr = tier === "high" ? 1.75 : 1;
  const [dpr, setDpr] = useState(tier === "high" ? 1.5 : 1);
  return (
    <div className="island__gl" data-running={running ? "" : undefined}>
    <Canvas
      className="island__canvas"
      dpr={Math.min(dpr, maxDpr)}
      frameloop={!running ? "never" : still ? "demand" : "always"}
      camera={{ fov: 35, position: CAMERA_HOME.toArray(), near: 0.5, far: 220 }}
      gl={{ antialias: tier === "high", powerPreference: "high-performance", alpha: false }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        onFallback={() => {
          setDpr(1);
          dropQualityTier();
        }}
      />
      <Scene {...props} />
    </Canvas>
    </div>
  );
}
