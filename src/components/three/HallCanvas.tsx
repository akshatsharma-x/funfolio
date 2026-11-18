"use client";

// The Trophy Room's Hall of Fame (PART 14): one pedestal per honor under its own spotlight, each with a procedural
// trophy — a lathe-turned cup, a medal hanging from a T-stand, a star plaque, a rolled scroll — in toon materials with
// ink outlines and gold accents, slowly spinning among sparkles. The HTML pedestal buttons over the canvas are the hit
// targets (no raycasting): trophies are laid out in the same columns, so hover / focus / click map 1:1. Hover spins a
// trophy faster and brightens its spotlight; selecting one dollies the camera to it (the detail card is HTML). Its own
// lazy chunk; renders only while on screen, unpaused and awake; reduced motion renders on demand with no spin.

import "@/components/three/quietThree";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ComponentProps } from "react";
import * as THREE from "three";
import type { TrophyKind } from "@/content/content";
import { hall } from "@/lib/hall";

export type HallCanvasProps = {
  slots: { id: string; kind: TrophyKind }[];
  running: boolean;
  still: boolean;
  low: boolean;
  onReady: () => void;
  onLost: () => void;
};

const INK = "#07060F";
const GOLD = "#FFC83D";
const GOLD_DEEP = "#C98A00";
const GOLD_HI = "#FFF1A8";
const CREAM = "#FFF4E0";
const PLINTH = "#2B2152";
const ORANGE = "#FF8A1F";
const CAM = new THREE.Vector3(0, 1.75, 9.2);
const LOOK = new THREE.Vector3(0, 1.05, 0);
const FOV = 30;

// ── materials: one 3-step toon gradient, one material per color (module scope) ─────────────────────────────────────
let gradient: THREE.DataTexture | null = null;
const cache = new Map<string, THREE.MeshToonMaterial>();
function toon(color: string, emissive?: string, intensity = 0): THREE.MeshToonMaterial {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    gradient.needsUpdate = true;
  }
  const key = `${color}|${emissive ?? ""}|${intensity}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
      m.emissiveIntensity = intensity;
    }
    cache.set(key, m);
  }
  return m;
}

// ── geometry ────────────────────────────────────────────────────────────────────────────────────────────────────
function starShape(outer: number, inner: number, points = 5): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
const CUP_PROFILE: [number, number][] = [
  [0, 0],
  [0.42, 0],
  [0.42, 0.07],
  [0.3, 0.1],
  [0.12, 0.16],
  [0.09, 0.36],
  [0.1, 0.46],
  [0.18, 0.52],
  [0.36, 0.62],
  [0.45, 0.8],
  [0.48, 1.0],
  [0.5, 1.08],
  [0.46, 1.08],
  [0.43, 0.98],
  [0.4, 0.8],
  [0.3, 0.66],
  [0, 0.62],
];

function useGeometries(low: boolean) {
  const geos = useMemo(() => {
    const seg = low ? 24 : 40;
    return {
      cup: new THREE.LatheGeometry(
        CUP_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
        seg,
      ),
      handle: new THREE.TorusGeometry(0.19, 0.04, 10, 20, Math.PI),
      plinth: new THREE.CylinderGeometry(0.62, 0.72, 1.2, seg),
      plinthCap: new THREE.CylinderGeometry(0.66, 0.66, 0.08, seg),
      trim: new THREE.TorusGeometry(0.665, 0.03, 8, seg),
      medal: new THREE.CylinderGeometry(0.42, 0.42, 0.09, seg),
      medalRim: new THREE.TorusGeometry(0.42, 0.035, 8, seg),
      star: new THREE.ExtrudeGeometry(starShape(0.24, 0.1), { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }),
      bigStar: new THREE.ExtrudeGeometry(starShape(0.34, 0.15), { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }),
      ribbon: new THREE.BoxGeometry(0.16, 0.62, 0.02),
      post: new THREE.CylinderGeometry(0.035, 0.035, 1.8, 10),
      bar: new THREE.CylinderGeometry(0.03, 0.03, 0.7, 10),
      ring: new THREE.TorusGeometry(0.06, 0.018, 8, 16),
      plaque: new THREE.BoxGeometry(0.95, 0.85, 0.1),
      plaqueBack: new THREE.BoxGeometry(1.03, 0.93, 0.07),
      foot: new THREE.BoxGeometry(0.62, 0.12, 0.32),
      roll: new THREE.CylinderGeometry(0.16, 0.16, 0.95, seg),
      knob: new THREE.CylinderGeometry(0.21, 0.21, 0.07, seg),
      cap: new THREE.SphereGeometry(0.07, 12, 8),
      band: new THREE.TorusGeometry(0.168, 0.026, 8, seg),
      cradle: new THREE.BoxGeometry(0.12, 0.2, 0.32),
      beam: new THREE.ConeGeometry(1.15, 4.2, 32, 1, true),
    };
  }, [low]);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);
  return geos;
}
type Geos = ReturnType<typeof useGeometries>;

function Mesh({ geometry, material, outline = 0.025, ...rest }: { geometry: THREE.BufferGeometry; material: THREE.Material; outline?: number } & Omit<ComponentProps<"mesh">, "geometry" | "material">) {
  return (
    <mesh geometry={geometry} material={material} {...rest}>
      {outline ? <Outlines thickness={outline} color={INK} /> : null}
    </mesh>
  );
}

function Trophy({ kind, g }: { kind: TrophyKind; g: Geos }) {
  const gold = toon(GOLD, GOLD_DEEP, 0.18);
  const deep = toon(GOLD_DEEP);
  const hi = toon(GOLD_HI, GOLD, 0.25);
  switch (kind) {
    case "cup":
      return (
        <group position={[0, 0.04, 0]}>
          <Mesh geometry={g.cup} material={gold} />
          <Mesh geometry={g.handle} material={gold} position={[0.46, 0.84, 0]} rotation={[0, 0, -Math.PI / 2]} />
          <Mesh geometry={g.handle} material={gold} position={[-0.46, 0.84, 0]} rotation={[0, 0, Math.PI / 2]} />
          <Mesh geometry={g.star} material={hi} position={[0, 0.74, 0.43]} scale={0.55} rotation={[-0.12, 0, 0]} outline={0.012} />
        </group>
      );
    case "medal":
      return (
        <group>
          <Mesh geometry={g.post} material={toon(PLINTH)} position={[0, 0.9, -0.16]} />
          <Mesh geometry={g.bar} material={deep} position={[0, 1.78, -0.16]} rotation={[0, 0, Math.PI / 2]} />
          <Mesh geometry={g.ribbon} material={toon(ORANGE)} position={[-0.1, 1.48, -0.08]} rotation={[0, 0, -0.32]} outline={0.015} />
          <Mesh geometry={g.ribbon} material={toon("#FFD23F")} position={[0.1, 1.48, -0.06]} rotation={[0, 0, 0.32]} outline={0.015} />
          <Mesh geometry={g.ring} material={deep} position={[0, 1.18, 0]} outline={0.01} />
          <group position={[0, 0.76, 0]}>
            <Mesh geometry={g.medal} material={gold} rotation={[Math.PI / 2, 0, 0]} />
            <Mesh geometry={g.medalRim} material={deep} outline={0.012} />
            <Mesh geometry={g.star} material={hi} position={[0, 0, 0.045]} outline={0.012} />
          </group>
        </group>
      );
    case "star":
      return (
        <group>
          <Mesh geometry={g.foot} material={toon(PLINTH)} position={[0, 0.06, 0]} />
          <Mesh geometry={g.plaqueBack} material={deep} position={[0, 0.6, -0.03]} />
          <Mesh geometry={g.plaque} material={toon("#3A2C6B")} position={[0, 0.6, 0]} outline={0.015} />
          <Mesh geometry={g.bigStar} material={gold} position={[0, 0.58, 0.04]} />
        </group>
      );
    case "scroll":
      return (
        <group position={[0, 0, 0]} rotation={[0, 0, 0.1]}>
          <Mesh geometry={g.cradle} material={toon(PLINTH)} position={[-0.3, 0.12, 0]} />
          <Mesh geometry={g.cradle} material={toon(PLINTH)} position={[0.3, 0.12, 0]} />
          <group position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <Mesh geometry={g.roll} material={toon(CREAM)} />
            <Mesh geometry={g.knob} material={gold} position={[0, 0.5, 0]} />
            <Mesh geometry={g.knob} material={gold} position={[0, -0.5, 0]} />
            <Mesh geometry={g.cap} material={deep} position={[0, 0.57, 0]} outline={0.01} />
            <Mesh geometry={g.cap} material={deep} position={[0, -0.57, 0]} outline={0.01} />
            <Mesh geometry={g.band} material={toon(ORANGE)} rotation={[Math.PI / 2, 0, 0]} outline={0.01} />
          </group>
        </group>
      );
  }
}

/** The world width the camera sees at the trophies' depth — the slots share it the way the HTML columns share the
 *  stage, so every trophy stands over its own button. */
function useSlotLayout(n: number) {
  const size = useThree((s) => s.size);
  return useMemo(() => {
    const d = CAM.distanceTo(LOOK);
    const aspect = size.width / Math.max(1, size.height);
    const width = 2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
    const step = width / Math.max(1, n);
    const scale = THREE.MathUtils.clamp(step / 2.5, 0.5, 1.15);
    return { xs: Array.from({ length: n }, (_, i) => (i + 0.5 - n / 2) * step), scale };
  }, [size.width, size.height, n]);
}

function Pedestal({ id, kind, x, scale, g, still, low }: { id: string; kind: TrophyKind; x: number; scale: number; g: Geos; still: boolean; low: boolean }) {
  const spinner = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const speed = useRef(0.35);
  const beamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: GOLD_HI, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    [],
  );
  useEffect(() => () => beamMat.dispose(), [beamMat]);
  useFrame((_, dt) => {
    const { hovered, selected } = hall.get();
    const hot = hovered === id || selected === id;
    const goal = still ? 0 : hot ? 1.7 : 0.35;
    // reduced motion renders on demand (a frame per change): snap instead of easing
    const k = still ? 1 : Math.min(1, dt * 6);
    speed.current += (goal - speed.current) * Math.min(1, dt * 5);
    if (spinner.current && !still) spinner.current.rotation.y += speed.current * dt;
    if (spot.current) spot.current.intensity += ((hot ? 5.2 : 2.4) - spot.current.intensity) * k;
    if (beam.current) beam.current.opacity += ((hot ? 0.12 : 0.05) - beam.current.opacity) * k;
  });
  return (
    <group position={[x, 0, 0]} scale={scale}>
      <primitive object={target} position={[0, 1.1, 0]} />
      <spotLight ref={spot} position={[0, 4.3, 1.7]} target={target} angle={0.42} penumbra={0.55} intensity={2.4} decay={0} distance={9} color="#FFE9B8" />
      <mesh geometry={g.beam} position={[0, 2.35, 0.6]} rotation={[0.38, 0, 0]}>
        <primitive object={beamMat} ref={beam} attach="material" />
      </mesh>
      <Mesh geometry={g.plinth} material={toon(PLINTH)} position={[0, -0.6, 0]} />
      <Mesh geometry={g.plinthCap} material={toon("#3A2C6B")} position={[0, 0.04, 0]} outline={0.015} />
      <mesh geometry={g.trim} material={toon(GOLD, GOLD_DEEP, 0.2)} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <group ref={spinner} position={[0, 0.08, 0]} rotation={[0, kind === "scroll" ? 0.4 : -0.3, 0]}>
        <Trophy kind={kind} g={g} />
      </group>
      {low ? null : <Sparkles count={14} scale={[1.4, 1.5, 1.4]} position={[0, 1.15, 0]} size={3.2} speed={still ? 0 : 0.35} opacity={0.9} noise={0.7} color={GOLD_HI} />}
    </group>
  );
}

/** Dollies to the selected trophy (it lands left of centre: the detail card is on the right) and back. */
function Rig({ xs, ids, scale, still }: { xs: number[]; ids: string[]; scale: number; still: boolean }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const pos = useRef(CAM.clone());
  const look = useRef(LOOK.clone());
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const goalLook = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => hall.subscribe(() => invalidate()), [invalidate]);
  useFrame((_, dt) => {
    const sel = hall.get().selected;
    const i = sel ? ids.indexOf(sel) : -1;
    if (i >= 0) {
      const x = xs[i];
      goalLook.set(x + 0.95 * scale, 1.0 * scale, 0);
      goalPos.set(x + 0.55 * scale, 1.45 * scale, 4.1 + 0.6 * scale);
    } else {
      goalLook.copy(LOOK);
      goalPos.copy(CAM);
    }
    const k = still ? 1 : 1 - Math.exp(-dt * 4.2);
    pos.current.lerp(goalPos, k);
    look.current.lerp(goalLook, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    if (still || pos.current.distanceToSquared(goalPos) > 1e-5) invalidate();
  });
  return null;
}

function Scene({ slots, still, low, onFirstFrame }: Omit<HallCanvasProps, "running" | "onReady" | "onLost"> & { onFirstFrame: () => void }) {
  const g = useGeometries(low);
  const { xs, scale } = useSlotLayout(slots.length);
  const ids = useMemo(() => slots.map((s) => s.id), [slots]);
  const first = useRef(false);
  useFrame(() => {
    if (first.current) return;
    first.current = true;
    onFirstFrame();
  });
  return (
    <>
      <hemisphereLight args={["#FFE9C7", "#1B1336", 0.55]} />
      <directionalLight position={[3, 6, 5]} intensity={0.7} />
      {slots.map((s, i) => (
        <Pedestal key={s.id} id={s.id} kind={s.kind} x={xs[i]} scale={scale} g={g} still={still} low={low} />
      ))}
      <Rig xs={xs} ids={ids} scale={scale} still={still} />
    </>
  );
}

export default function HallCanvas(props: HallCanvasProps) {
  const { running, still, low, onReady, onLost } = props;
  const ready = useRef(false);
  return (
    <Canvas
      className="hall-canvas"
      dpr={[1, low ? 1 : 1.5]}
      frameloop={!running ? "never" : still ? "demand" : "always"}
      camera={{ position: CAM.toArray(), fov: FOV, near: 0.1, far: 40 }}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(LOOK);
        gl.domElement.addEventListener("webglcontextlost", () => onLost(), { once: true });
      }}
    >
      <Scene
        {...props}
        onFirstFrame={() => {
          if (ready.current) return;
          ready.current = true;
          onReady();
        }}
      />
    </Canvas>
  );
}
