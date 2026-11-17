"use client";

// The Lab's research-route globe (PART 9): a lightweight R3F dotted globe — no globe library, no remote textures or
// GeoJSON (R10): the land is ~4.6k hexagon dots from /data/land-dots.json (the site's own file, built from Natural
// Earth by `npm run globe`). A dashed great-circle arc Jaipur → Hanoi with a paper plane gliding along it, pulsing pins
// and HTML labels projected from 3D. Renders only while on screen, unpaused and awake; a single frame under reduced
// motion. Lazy chunk (shares three + R3F with the Title island); HIGH tier on fine pointers only.

import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import "./quietThree";
import type { Line2 } from "three-stdlib";
import { greatCircleArc, toVec3, type LatLon } from "@/lib/geo";

export type GlobeCanvasProps = {
  route: { from: LatLon; to: LatLon };
  running: boolean;
  still: boolean;
  spin: boolean;
  /** Bump to turn the globe back to the route. */
  recenter: number;
  labels: { from: RefObject<HTMLElement | null>; to: RefObject<HTMLElement | null> };
  onReady: () => void;
  onLost: () => void;
};

const VIOLET = new THREE.Color("#A78BFA");
const SPIN = 0.09; // rad/s, slower while the route faces the camera

/** Turn the globe (about y) so a longitude faces the camera at +z. */
const yawFor = (lon: number) => (-lon * Math.PI) / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function Land({ dots }: { dots: number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = dots.length / 2;
  const geometry = useMemo(() => new THREE.CircleGeometry(0.0118, 6), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    let seed = 3;
    for (let i = 0; i < count; i++) {
      const [x, y, z] = toVec3({ lat: dots[i * 2], lon: dots[i * 2 + 1] }, 1.002);
      o.position.set(x, y, z);
      o.lookAt(x * 2, y * 2, z * 2);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      seed = (seed * 16807) % 2147483647;
      c.set("#D9CCFF").multiplyScalar(0.86 + (seed / 2147483647) * 0.2);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dots, count]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: VIOLET } },
        vertexShader: "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 uColor; varying vec3 vN; varying vec3 vP; void main(){ float f = pow(max(0.0, 0.7 - dot(normalize(vN), normalize(-vP))), 3.4); gl_FragColor = vec4(uColor * f * 0.85, f * 0.8); }",
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh scale={1.13} material={material}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  );
}

function Pin({ at, still }: { at: LatLon; still: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const [x, y, z] = toVec3(at, 1.004);
  const pos = useMemo(() => new THREE.Vector3(x, y, z), [x, y, z]);
  // local orientation: +z out of the globe (lookAt would read the target in world space, and the parent spins)
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  useFrame(({ clock }) => {
    const r = ring.current;
    if (!r || still) return;
    const t = (clock.elapsedTime % 1.8) / 1.8;
    r.scale.setScalar(1 + t * 1.6);
    (r.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.016, 0.06, 10]} />
        <meshBasicMaterial color="#FFD23F" toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.022, 0.032, 32]} />
        <meshBasicMaterial color="#FFD23F" transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A paper plane (three triangles) gliding along the arc, nose first, belly to the globe. */
function PaperPlane({ curve, still }: { curve: THREE.CatmullRomCurve3; still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // nose at +z; wings and keel trail behind
    const v = [0, 0, 0.05, -0.034, 0.004, -0.03, 0, 0.0, -0.018, 0, 0, 0.05, 0, 0.0, -0.018, 0.034, 0.004, -0.03, 0, 0, 0.05, 0, -0.014, -0.026, 0, 0.0, -0.018];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const at = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = still ? 0.5 : (clock.elapsedTime % 6) / 4.6;
    m.visible = t <= 1;
    if (t > 1) return;
    curve.getPointAt(t, at);
    curve.getPointAt(Math.min(1, t + 0.01), ahead);
    m.position.copy(at);
    // +z toward the next point, belly to the globe — in the parent's (spinning) local space
    look.lookAt(ahead, at, up.copy(at).normalize());
    m.quaternion.setFromRotationMatrix(look);
  });
  return (
    <mesh ref={ref} geometry={geometry}>
      <meshBasicMaterial color="#FFF4E0" side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function Route({ route, still }: { route: GlobeCanvasProps["route"]; still: boolean }) {
  const line = useRef<Line2>(null);
  const points = useMemo(() => greatCircleArc(route.from, route.to, 72, 0.2), [route]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  useFrame((_, dt) => {
    const mat = line.current?.material as { dashOffset?: number } | undefined;
    if (mat && !still) mat.dashOffset = (mat.dashOffset ?? 0) - dt * 0.09;
  });
  return (
    <>
      <Line ref={line} points={points} color="#FFD23F" lineWidth={2.4} dashed dashSize={0.045} gapSize={0.028} transparent opacity={0.95} />
      <PaperPlane curve={curve} still={still} />
      <Pin at={route.from} still={still} />
      <Pin at={route.to} still={still} />
    </>
  );
}

function Globe({ dots, route, still, spin, recenter, labels, hovering, dragging, onFirstFrame }: Omit<GlobeCanvasProps, "running" | "onReady" | "onLost"> & { dots: number[]; hovering: RefObject<boolean>; dragging: RefObject<boolean>; onFirstFrame: () => void }) {
  const spinGroup = useRef<THREE.Group>(null);
  const { camera, size, invalidate } = useThree();
  const midLon = (route.from.lon + route.to.lon) / 2;
  const midLat = (route.from.lat + route.to.lat) / 2;
  const target = useRef<number | null>(null);
  const first = useRef(true);
  const v = useMemo(() => new THREE.Vector3(), []);
  const n = useMemo(() => new THREE.Vector3(), []);
  const pins = useMemo(() => [new THREE.Vector3(...toVec3(route.from, 1.004)), new THREE.Vector3(...toVec3(route.to, 1.004))], [route]);

  useEffect(() => {
    if (recenter) {
      target.current = yawFor(midLon);
      invalidate();
    }
  }, [recenter, midLon, invalidate]);

  useFrame((_, dt) => {
    const g = spinGroup.current;
    if (!g) return;
    if (target.current !== null) {
      const d = wrap(target.current - g.rotation.y);
      g.rotation.y += d * Math.min(1, dt * 4);
      if (Math.abs(d) < 0.002) target.current = null;
      else invalidate();
    } else if (spin && !still && !hovering.current && !dragging.current) {
      // linger while the route faces the camera
      const off = Math.abs(wrap(g.rotation.y - yawFor(midLon)));
      g.rotation.y += dt * SPIN * (0.35 + 0.65 * Math.min(1, off / 1.2));
    }
    // project the pins onto their HTML labels; hide a label while its pin is behind the globe
    camera.getWorldDirection(n);
    [labels.from.current, labels.to.current].forEach((el, i) => {
      if (!el) return;
      v.copy(pins[i]).applyMatrix4(g.matrixWorld);
      const facing = -v.clone().normalize().dot(n);
      v.project(camera);
      el.style.transform = `translate(${(((v.x + 1) / 2) * size.width).toFixed(1)}px, ${(((1 - v.y) / 2) * size.height).toFixed(1)}px)`;
      el.toggleAttribute("data-hidden", facing < 0.2);
    });
    if (first.current) {
      first.current = false;
      onFirstFrame();
    }
  });

  return (
    <group rotation={[(midLat * Math.PI) / 180 * 0.8, 0, 0]}>
      <group ref={spinGroup} rotation={[0, yawFor(midLon), 0]}>
        <mesh>
          <sphereGeometry args={[0.996, 64, 48]} />
          <meshBasicMaterial color="#1B1142" toneMapped={false} />
        </mesh>
        <Land dots={dots} />
        <Route route={route} still={still} />
      </group>
      <Atmosphere />
    </group>
  );
}

export default function GlobeCanvas(props: GlobeCanvasProps) {
  const { running, still, onReady, onLost } = props;
  const [dots, setDots] = useState<number[] | null>(null);
  const hovering = useRef(false);
  const dragging = useRef(false);
  const ready = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/land-dots.json")
      .then((r) => r.json())
      .then((j: { dots: number[] }) => {
        if (!cancelled) setDots(j.dots);
      })
      .catch(() => onLost());
    return () => {
      cancelled = true;
    };
  }, [onLost]);

  if (!dots) return null;
  return (
    <div
      className="globe-canvas"
      data-cursor="grab"
      onPointerEnter={() => {
        hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={!running ? "never" : still ? "demand" : "always"}
        camera={{ position: [0, 0, 3.7], fov: 36, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", () => onLost(), { once: true });
        }}
      >
        <Globe
          {...props}
          dots={dots}
          hovering={hovering}
          dragging={dragging}
          onFirstFrame={() => {
            if (ready.current) return;
            ready.current = true;
            onReady();
          }}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.45}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.68}
          onStart={() => {
            dragging.current = true;
          }}
          onEnd={() => {
            dragging.current = false;
          }}
        />
      </Canvas>
    </div>
  );
}
