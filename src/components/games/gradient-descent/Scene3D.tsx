"use client";

// Gradient Descent's 3D view (PART 12): the loss landscape as a flat-shaded, height-colored mesh, the ball, a trail of
// its last iterates, the local minima's rings and the glowing global-minimum flag. Its own lazy chunk (three + R3F are
// shared with the island and the globe); mounted only while the game is open, rendering only while it isn't paused
// (frameloop "never"), and R3F releases its WebGL context when it unmounts.

import "@/components/three/quietThree";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLOBAL, HALF, height, heightColor, ITER_MS, LOCALS, normHeight, type Point } from "./landscape";

const HS = 1.15; // height scale
const BALL_R = 0.22;
const TRAIL = 14;
export type DescentView = { p: Point; prev: Point; acc: number; trail: Point[] };

function Landscape({ segments }: { segments: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(HALF * 2, HALF * 2, segments, segments);
    g.rotateX(-Math.PI / 2); // plane (x, y) → ground (x, −z); world y = height
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = height(x, z);
      pos.setY(i, h * HS);
      const [r, gg, b] = heightColor(normHeight(h));
      // palette values are sRGB; vertex colors are linear (three's color management) — convert, or mid-tones wash out
      c.setRGB(r / 255, gg / 255, b / 255, THREE.SRGBColorSpace);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={0.92} metalness={0} />
    </mesh>
  );
}

const lerpP = (v: DescentView) => {
  const a = Math.min(1, v.acc / ITER_MS);
  return { x: v.prev.x + (v.p.x - v.prev.x) * a, y: v.prev.y + (v.p.y - v.prev.y) * a };
};

function Ball({ view }: { view: RefObject<DescentView> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = lerpP(view.current);
    ref.current?.position.set(p.x, height(p.x, p.y) * HS + BALL_R, p.y);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[BALL_R, 24, 16]} />
      <meshStandardMaterial color="#fff4e0" emissive="#ffc83d" emissiveIntensity={0.3} roughness={0.35} />
    </mesh>
  );
}

function Trail({ view }: { view: RefObject<DescentView> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const trail = view.current.trail;
    for (let i = 0; i < TRAIL; i++) {
      const p = trail[trail.length - 1 - i];
      if (p) m.makeTranslation(p.x, height(p.x, p.y) * HS + 0.06, p.y);
      else m.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TRAIL]}>
      <sphereGeometry args={[0.06, 8, 6]} />
      <meshBasicMaterial color="#fff4e0" transparent opacity={0.7} />
    </instancedMesh>
  );
}

function Flag({ reduced }: { reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const y0 = height(GLOBAL.x, GLOBAL.y) * HS;
  useFrame(({ clock }) => {
    if (reduced || !ring.current) return;
    const k = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
    ring.current.scale.set(k, k, k);
  });
  return (
    <group position={[GLOBAL.x, y0, GLOBAL.y]}>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.3, 8]} />
        <meshStandardMaterial color="#fff4e0" />
      </mesh>
      <mesh position={[0.29, 1.12, 0]}>
        <planeGeometry args={[0.56, 0.34]} />
        <meshStandardMaterial color="#b6ff3b" emissive="#b6ff3b" emissiveIntensity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[0.5, 0.05, 8, 40]} />
        <meshStandardMaterial color="#b6ff3b" emissive="#b6ff3b" emissiveIntensity={1.2} />
      </mesh>
      <pointLight color="#b6ff3b" intensity={2.5} distance={3} position={[0, 0.6, 0]} />
    </group>
  );
}

function Pits() {
  return (
    <>
      {LOCALS.map((b) => (
        // at the wall's height where the ring runs (at the pit's bottom height the walls would hide it)
        <mesh key={`${b.x},${b.y}`} rotation={[-Math.PI / 2, 0, 0]} position={[b.x, height(b.x + 0.42, b.y) * HS + 0.05, b.y]}>
          <torusGeometry args={[0.42, 0.05, 6, 32]} />
          <meshBasicMaterial color="#e4dcff" transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

export default function Scene3D({ view, paused, low, reduced }: { view: RefObject<DescentView>; paused: boolean; low: boolean; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, low ? 1 : 1.5]}
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0, 8.6, 8.4], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: !low, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, -0.6, 0.4)}
    >
      <color attach="background" args={["#0b0818"]} />
      <hemisphereLight args={["#c4b5fd", "#1b1336", 0.95]} />
      <directionalLight position={[5, 9, 4]} intensity={1.15} />
      <Landscape segments={low ? 56 : 96} />
      <Pits />
      <Flag reduced={reduced} />
      <Trail view={view} />
      <Ball view={view} />
    </Canvas>
  );
}
