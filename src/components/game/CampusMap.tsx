import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { derive, createGame } from "@/game/engine";
import { stageCopy } from "@/game/content";
import { IsoFallback } from "./IsoFallback";
import type { Employee, GameState, Stage, TabId } from "@/game/types";

const INK = "#141210";
const PAPER = "#e7e2d6";
const SAGE = "#8fad90";
const COPPER = "#c4a574";
const CRIMSON = "#c45c4a";
const WOOD = "#6b5344";
const PLASTER = "#d9d2c4";
const STEEL = "#4a4a46";
const GLASS = "#9aada0";
const ASPHALT = "#2a2722";
const GRASS = "#243028";
const SKY = "#12110f";
const BRICK = "#b56a4c";
const BRICK_DK = "#8a4a36";

const STAGE_RANK: Record<Stage, number> = {
  garage: 0,
  loft: 1,
  office: 2,
  warehouse: 3,
  campus: 4,
  tower: 5,
};

type Lot = {
  tab: TabId;
  label: string;
  pos: [number, number, number];
  size: [number, number, number];
  wall: string;
  roof: string;
};

const LOTS: Lot[] = [
  { tab: "lab", label: "Lab", pos: [-6.6, 0, 4.2], size: [5.6, 2.5, 4.8], wall: BRICK, roof: BRICK_DK },
  { tab: "cluster", label: "GPUs", pos: [6.8, 0, 3.6], size: [6.2, 3.1, 5.6], wall: "#3a3a38", roof: "#2a2a28" },
  { tab: "store", label: "Shop", pos: [0.1, 0, 8.6], size: [4.8, 2.3, 3.9], wall: "#8a5a3a", roof: "#6a3e28" },
  { tab: "crew", label: "People", pos: [-6.8, 0, -5.6], size: [5.4, 3.5, 4.6], wall: PLASTER, roof: "#6d7c86" },
  { tab: "floor", label: "HQ", pos: [6.2, 0, -6.0], size: [5.8, 4.2, 5.0], wall: PLASTER, roof: SAGE },
  { tab: "shadow", label: "Dark", pos: [-12.4, 0, -0.6], size: [3.6, 1.6, 3.6], wall: "#2a221e", roof: "#1a1614" },
];

const ROAD = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-14, 0.12, 10),
    new THREE.Vector3(4, 0.12, 13),
    new THREE.Vector3(16, 0.12, 6),
    new THREE.Vector3(15, 0.12, -10),
    new THREE.Vector3(-2, 0.12, -14),
    new THREE.Vector3(-16, 0.12, -4),
    new THREE.Vector3(-15, 0.12, 6),
  ],
  true,
);

type MapProps = {
  state: GameState;
  selected: TabId | null;
  onSelect: (tab: TabId) => void;
  preview?: boolean;
};

class MapError extends Component<{ children: ReactNode; fallback: ReactNode }, { fail: boolean }> {
  state = { fail: false };
  static getDerivedStateFromError() {
    return { fail: true };
  }
  render() {
    return this.state.fail ? this.props.fallback : this.props.children;
  }
}

export function CampusMap({ state, selected, onSelect, preview = false }: MapProps) {
  const [mode, setMode] = useState<"boot" | "gl" | "iso">("boot");
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      setMode(gl ? "gl" : "iso");
    } catch {
      setMode("iso");
    }
  }, []);

  if (mode === "boot") return <div className="absolute inset-0 bg-bg" />;
  if (mode === "iso") {
    return (
      <IsoFallback
        selected={selected}
        onSelect={onSelect}
        preview={preview}
        company={state.company}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <MapError
        fallback={
          <IsoFallback selected={selected} onSelect={onSelect} preview={preview} company={state.company} />
        }
      >
        <Canvas
          className="map-canvas h-full w-full"
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: preview ? [18, 13, 20] : [22, 16, 22], fov: 36, near: 0.2, far: 110 }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(SKY, 1);
            gl.shadowMap.type = THREE.PCFShadowMap;
            scene.background = new THREE.Color(SKY);
          }}
          style={{ background: SKY, touchAction: "none" }}
        >
          <fog attach="fog" args={[SKY, 28, 64]} />
          <hemisphereLight args={[PAPER, ASPHALT, 0.62]} />
          <ambientLight intensity={0.32} />
          <directionalLight
            castShadow
            position={[14, 22, 10]}
            intensity={1.45}
            color="#fff1d6"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={2}
            shadow-camera-far={56}
            shadow-camera-left={-18}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
          />
          <World state={state} selected={selected} onSelect={onSelect} preview={preview} />
          <ContactShadows opacity={0.38} scale={52} blur={2.2} far={12} color={INK} />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.085}
            minPolarAngle={0.62}
            maxPolarAngle={1.18}
            minDistance={preview ? 18 : 12}
            maxDistance={44}
            autoRotate={preview || !selected}
            autoRotateSpeed={preview ? 0.42 : 0.28}
            target={[0, 1.6, 0]}
          />
        </Canvas>
      </MapError>
    </div>
  );
}

function World({ state, selected, onSelect, preview }: MapProps) {
  const d = derive(state);
  const rank = STAGE_RANK[d.stage];
  const cards = Math.max(1, state.gpus.h100 + state.gpus.b200 + state.gpus.gb200);
  const walkers = Math.min(preview ? 10 : 14, Math.max(4, state.employees.length + 3));
  const hint = selected ?? d.hintTab;

  return (
    <group>
      <Ground rank={rank} />
      <FocusRig selected={selected} />
      {LOTS.map((lot) => (
        <LotBuilding
          key={lot.tab}
          lot={lot}
          state={state}
          rank={rank}
          cards={cards}
          selected={selected === lot.tab}
          hinted={hint === lot.tab && !selected}
          onSelect={onSelect}
          preview={Boolean(preview)}
        />
      ))}
      {rank >= 4 && <Pavilion />}
      {rank >= 5 && <Spire listed={state.listed} />}
      {Array.from({ length: walkers }).map((_, i) => (
        <CampusWalker
          key={i}
          offset={i / walkers}
          speed={0.014 + (i % 4) * 0.003}
          color={i % 3 === 0 ? SAGE : i % 3 === 1 ? COPPER : PAPER}
        />
      ))}
      <Car offset={0} color="#c45c4a" />
      <Car offset={0.42} color="#3d4a44" />
      {rank >= 2 && <Car offset={0.71} color={STEEL} />}
      <Trees />
      {d.revenue > 4 && <CoinFountain origin={LOTS[2]!.pos} />}
    </group>
  );
}

function FocusRig({ selected }: { selected: TabId | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  const goal = useMemo(() => new THREE.Vector3(0, 1.6, 0), []);
  const camGoal = useMemo(() => new THREE.Vector3(22, 16, 22), []);
  useFrame((_, raw) => {
    if (!controls) return;
    const dt = Math.min(raw, 0.1);
    const lot = LOTS.find((f) => f.tab === selected);
    if (lot) {
      goal.set(lot.pos[0], lot.size[1] * 0.45, lot.pos[2]);
      camGoal.set(lot.pos[0] + 9.5, lot.size[1] + 7.2, lot.pos[2] + 9.5);
    } else {
      goal.set(0, 1.6, 0);
      camGoal.set(22, 16, 22);
    }
    controls.target.lerp(goal, 1 - Math.exp(-3.2 * dt));
    if (lot) camera.position.lerp(camGoal, 1 - Math.exp(-1.6 * dt));
    controls.update();
  });
  return null;
}

function Ground({ rank }: { rank: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#161410" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[18, 48]} />
        <meshStandardMaterial color={rank >= 4 ? GRASS : "#1c1a16"} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9.4, 0.03, 6.2]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <ringGeometry args={[11.6, 13.4, 48]} />
        <meshStandardMaterial color="#23201c" roughness={0.92} />
      </mesh>
      {LOTS.map((lot) => (
        <mesh key={lot.tab} rotation={[-Math.PI / 2, 0, 0]} position={[lot.pos[0], 0.04, lot.pos[2]]} receiveShadow>
          <planeGeometry args={[lot.size[0] + 1.6, lot.size[2] + 1.6]} />
          <meshStandardMaterial color="#1f1c18" roughness={0.9} />
        </mesh>
      ))}
      {rank >= 3 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.04, 8]} receiveShadow>
          <planeGeometry args={[7, 5]} />
          <meshStandardMaterial color="#3a342c" roughness={0.88} />
        </mesh>
      )}
    </group>
  );
}

function LotBuilding({
  lot,
  state,
  rank,
  cards,
  selected,
  hinted,
  onSelect,
  preview,
}: {
  lot: Lot;
  state: GameState;
  rank: number;
  cards: number;
  selected: boolean;
  hinted: boolean;
  onSelect: (tab: TabId) => void;
  preview: boolean;
}) {
  const [w, h, d] = lot.size;
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((st) => {
    if (!mat.current) return;
    mat.current.emissiveIntensity = hinted ? 0.28 + Math.sin(st.clock.elapsedTime * 3.4) * 0.16 : selected ? 0.12 : 0;
  });

  return (
    <group position={lot.pos}>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.08} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial
          ref={mat}
          color={lot.wall}
          roughness={0.72}
          metalness={lot.tab === "cluster" ? 0.28 : 0.04}
          emissive={SAGE}
          emissiveIntensity={0}
        />
      </RoundedBox>
      <RoundedBox args={[w + 0.35, 0.22, d + 0.35]} position={[0, h + 0.08, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={lot.roof} roughness={0.55} />
      </RoundedBox>
      <WindowStrip tab={lot.tab} width={w} height={h} depth={d} />
      {lot.tab === "lab" && <LabRoof w={w} h={h} d={d} training={!!state.training} />}
      {lot.tab === "cluster" && <GpuRoof w={w} h={h} />}
      {lot.tab === "store" && <Awning w={w} h={h} d={d} live={state.products.length > 0} />}
      {lot.tab === "floor" && state.listed && <Flag position={[w * 0.38, h, d * 0.38]} />}
      <group position={[0, 0.12, 0]} scale={Math.min(w, d) / 6.2}>
        <Interior tab={lot.tab} state={state} rank={rank} cards={cards} />
      </group>
      {!preview && (
        <FloorPeople count={peopleOn(lot.tab, state)} y={0.42} seed={w + h} />
      )}
      <SelectRing on={selected} radius={Math.max(w, d) * 0.58} />
      <GlowPad on={hinted} radius={Math.max(w, d) * 0.7} />
      <Beacon on={hinted} height={h} />
      <BuildingLabel label={lot.label} height={h} active={selected || hinted} hint={hinted} />
      <mesh
        position={[0, h * 0.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(lot.tab);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[w + 0.4, h + 0.4, d + 0.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function WindowStrip({ tab, width, height, depth }: { tab: TabId; width: number; height: number; depth: number }) {
  const cols = tab === "shadow" ? 2 : 4;
  const rows = tab === "shadow" ? 1 : Math.max(1, Math.round(height / 1.35));
  const lit = tab !== "shadow";
  const panes: { p: [number, number, number]; rot: [number, number, number] }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = -width / 2 + 0.7 + c * ((width - 1.4) / Math.max(1, cols - 1));
      const v = 0.7 + r * ((height - 1.1) / Math.max(1, rows));
      panes.push({ p: [u, v, depth / 2 + 0.03], rot: [0, 0, 0] });
      if (c % 2 === 0) panes.push({ p: [width / 2 + 0.03, v, u * (depth / width)], rot: [0, Math.PI / 2, 0] });
    }
  }
  return (
    <group>
      {panes.map((pane, i) => (
        <mesh key={i} position={pane.p} rotation={pane.rot}>
          <boxGeometry args={[0.42, 0.46, 0.05]} />
          <meshStandardMaterial
            color={GLASS}
            emissive={tab === "shadow" ? CRIMSON : SAGE}
            emissiveIntensity={lit ? 0.22 + (i % 4) * 0.08 : 0.08}
            roughness={0.22}
            metalness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function LabRoof({ w, h, d, training }: { w: number; h: number; d: number; training: boolean }) {
  return (
    <group>
      <mesh position={[-w * 0.18, h + 0.55, 0]} rotation={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[w * 0.48, 0.12, d * 0.92]} />
        <meshStandardMaterial color={BRICK_DK} />
      </mesh>
      <mesh position={[w * 0.18, h + 0.55, 0]} rotation={[0, 0, -0.45]} castShadow>
        <boxGeometry args={[w * 0.48, 0.12, d * 0.92]} />
        <meshStandardMaterial color={BRICK_DK} />
      </mesh>
      <mesh position={[w * 0.32, h + 1.05, -d * 0.2]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 1.1, 8]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
      {training && <pointLight position={[0, h + 1.2, 0]} color={SAGE} intensity={1.4} distance={8} />}
    </group>
  );
}

function GpuRoof({ w, h }: { w: number; h: number }) {
  return (
    <group>
      {[-1.4, 0, 1.4].map((x) => (
        <RoundedBox key={x} args={[1.1, 0.35, 0.8]} position={[x, h + 0.32, 0.4]} radius={0.04} castShadow>
          <meshStandardMaterial color={STEEL} metalness={0.4} />
        </RoundedBox>
      ))}
      <pointLight position={[0, h + 0.8, 0]} color={SAGE} intensity={0.6} distance={6} />
    </group>
  );
}

function Awning({ w, h, d, live }: { w: number; h: number; d: number; live: boolean }) {
  return (
    <group>
      <mesh position={[0, h * 0.62, d / 2 + 0.35]} castShadow>
        <boxGeometry args={[w * 0.92, 0.08, 0.7]} />
        <meshStandardMaterial color={live ? SAGE : COPPER} />
      </mesh>
      {live && <pointLight position={[0, h * 0.7, d / 2 + 0.5]} color={SAGE} intensity={0.8} distance={5} />}
    </group>
  );
}

function peopleOn(tab: TabId, state: GameState) {
  if (tab === "crew") return Math.min(8, Math.max(1, state.employees.length));
  if (tab === "lab") return state.training ? 3 : 1;
  if (tab === "cluster") return Math.min(4, 1 + Math.floor((state.gpus.h100 + state.gpus.b200) / 4));
  if (tab === "store") return state.products.length ? Math.min(6, 2 + Math.floor(state.users / 4000)) : 0;
  if (tab === "floor") return Math.min(5, 1 + Math.floor(state.employees.length / 4));
  return state.evil > 6 ? 2 : 1;
}

function Interior({ tab, state, rank, cards }: { tab: TabId; state: GameState; rank: number; cards: number }) {
  if (tab === "lab") return <LabSet training={!!state.training} />;
  if (tab === "cluster") return <ClusterSet cards={cards} trainPct={state.trainPct} />;
  if (tab === "store") return <ShopSet live={state.products.length > 0} />;
  if (tab === "crew") return <OfficeSet n={Math.min(8, state.employees.length)} />;
  if (tab === "floor") return <BoardSet listed={state.listed} rank={rank} />;
  return <BunkerSet hot={state.evil > 8 || state.scandal > 10} />;
}

function LabSet({ training }: { training: boolean }) {
  const glow = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (glow.current) glow.current.intensity = training ? 1.3 + Math.sin(s.clock.elapsedTime * 4.4) * 0.45 : 0.2;
  });
  return (
    <group>
      <RoundedBox args={[2.4, 0.7, 1.1]} position={[-1.6, 0.45, 1.1]} radius={0.05} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </RoundedBox>
      <mesh position={[-1.6, 0.95, 0.85]}>
        <boxGeometry args={[0.9, 0.55, 0.08]} />
        <meshStandardMaterial color={INK} emissive={training ? SAGE : PAPER} emissiveIntensity={training ? 0.7 : 0.12} />
      </mesh>
      <Rack position={[1.6, 0.85, -1.1]} train={training} />
      <Rack position={[0.9, 0.85, -1.1]} train={training} />
      {training && <pointLight ref={glow} position={[0.2, 1.6, 0]} color={SAGE} distance={7} />}
    </group>
  );
}

function ClusterSet({ cards, trainPct }: { cards: number; trainPct: number }) {
  const n = Math.min(12, Math.max(3, Math.round(cards)));
  const cols = 4;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const cx = -1.6 + (i % cols) * 0.85;
        const cz = -1.2 + Math.floor(i / cols) * 1.05;
        return <Rack key={i} position={[cx, 0.82, cz]} train={i < Math.round((trainPct / 100) * n)} />;
      })}
    </group>
  );
}

function Rack({ position, train }: { position: [number, number, number]; train: boolean }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => {
    if (!mat.current) return;
    mat.current.emissiveIntensity = train ? 0.75 + Math.sin(s.clock.elapsedTime * 6 + position[0] * 3) * 0.35 : 0.1;
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.48, 1.5, 0.42]} />
        <meshStandardMaterial ref={mat} color={INK} emissive={train ? SAGE : COPPER} metalness={0.28} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.55, 0.22]}>
        <boxGeometry args={[0.32, 0.08, 0.04]} />
        <meshStandardMaterial color={train ? SAGE : CRIMSON} emissive={train ? SAGE : CRIMSON} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function ShopSet({ live }: { live: boolean }) {
  return (
    <group>
      {[-1.2, 0, 1.2].map((x, i) => (
        <group key={i} position={[x, 0, 0.2]}>
          <RoundedBox args={[1.05, 1.05, 0.6]} position={[0, 0.62, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color="#5c4638" />
          </RoundedBox>
          <mesh position={[0, 0.72, 0.32]}>
            <boxGeometry args={[0.85, 0.55, 0.05]} />
            <meshStandardMaterial color={INK} emissive={live ? SAGE : STEEL} emissiveIntensity={live ? 0.55 : 0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OfficeSet({ n }: { n: number }) {
  const desks = Math.min(6, Math.max(2, n));
  return (
    <group>
      {Array.from({ length: desks }).map((_, i) => {
        const cx = -1.6 + (i % 3) * 1.5;
        const cz = -0.9 + Math.floor(i / 3) * 1.8;
        return (
          <group key={i} position={[cx, 0, cz]}>
            <RoundedBox args={[1.1, 0.12, 0.65]} position={[0, 0.52, 0]} radius={0.03} castShadow>
              <meshStandardMaterial color={WOOD} />
            </RoundedBox>
            <mesh position={[0.3, 0.72, -0.08]}>
              <boxGeometry args={[0.36, 0.26, 0.05]} />
              <meshStandardMaterial color={INK} emissive={PAPER} emissiveIntensity={0.18} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BoardSet({ listed, rank }: { listed: boolean; rank: number }) {
  return (
    <group>
      <RoundedBox args={[3.6, 0.12, 1.4]} position={[0, 0.62, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.45} />
      </RoundedBox>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.38, 0.85]}>
          <boxGeometry args={[0.34, 0.46, 0.34]} />
          <meshStandardMaterial color={STEEL} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, -1.4]}>
        <boxGeometry args={[2.6, 0.9, 0.08]} />
        <meshStandardMaterial color={INK} emissive={listed ? SAGE : COPPER} emissiveIntensity={0.35} />
      </mesh>
      {rank >= 4 && <Flag position={[2.2, 0, 1.6]} />}
    </group>
  );
}

function BunkerSet({ hot }: { hot: boolean }) {
  return (
    <group>
      <RoundedBox args={[2.4, 0.9, 1.8]} position={[0, 0.55, 0]} radius={0.05} castShadow>
        <meshStandardMaterial color="#1a1614" />
      </RoundedBox>
      <mesh position={[0, 0.6, 0.95]}>
        <boxGeometry args={[0.55, 0.7, 0.08]} />
        <meshStandardMaterial color={INK} emissive={hot ? CRIMSON : STEEL} emissiveIntensity={hot ? 0.7 : 0.12} />
      </mesh>
      {hot && <pointLight position={[0, 1.1, 0.3]} color={CRIMSON} intensity={0.8} distance={4} />}
    </group>
  );
}

function Pavilion() {
  return (
    <group position={[-11, 0, 7.5]}>
      <RoundedBox args={[4.2, 1.8, 3.4]} position={[0, 0.9, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color={PLASTER} />
      </RoundedBox>
      <RoundedBox args={[4.6, 0.16, 3.8]} position={[0, 1.86, 0]} radius={0.04}>
        <meshStandardMaterial color={SAGE} />
      </RoundedBox>
    </group>
  );
}

function Spire({ listed }: { listed: boolean }) {
  return (
    <group position={[0, 0, -12.6]}>
      <RoundedBox args={[2.4, 9.5, 2.4]} position={[0, 4.75, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color={PLASTER} metalness={0.12} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.4, 8]} />
        <meshStandardMaterial color={listed ? SAGE : STEEL} emissive={listed ? SAGE : "#000"} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Flag({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 2.4) * 0.4;
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 3.2, 6]} />
        <meshStandardMaterial color={STEEL} metalness={0.5} />
      </mesh>
      <mesh ref={ref} position={[0.4, 2.9, 0]}>
        <planeGeometry args={[0.8, 0.44]} />
        <meshStandardMaterial color={SAGE} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SelectRing({ on, radius }: { on: boolean; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.visible = on;
    const k = 1 + Math.sin(s.clock.elapsedTime * 3) * 0.03;
    ref.current.scale.set(k, 1, k);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
      <ringGeometry args={[radius * 0.88, radius, 48]} />
      <meshBasicMaterial color={SAGE} transparent opacity={0.85} />
    </mesh>
  );
}

function GlowPad({ on, radius }: { on: boolean; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.visible = on;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = on ? 0.18 + Math.sin(s.clock.elapsedTime * 3.2) * 0.1 : 0;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial color={SAGE} transparent opacity={0.2} />
    </mesh>
  );
}

function Beacon({ on, height }: { on: boolean; height: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.visible = on;
    if (!on) return;
    const t = s.clock.elapsedTime;
    ref.current.position.y = height + 1.15 + Math.sin(t * 2.6) * 0.22;
    ref.current.rotation.y = t * 1.8;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.9 + Math.sin(t * 4.2) * 0.45;
  });
  return (
    <mesh ref={ref} position={[0, height + 1.15, 0]}>
      <octahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color={SAGE} emissive={SAGE} emissiveIntensity={1} toneMapped={false} />
    </mesh>
  );
}

function BuildingLabel({ label, height, active, hint }: { label: string; height: number; active: boolean; hint: boolean }) {
  return (
    <Html position={[0, height + 1.85, 0]} center distanceFactor={28} style={{ pointerEvents: "none" }}>
      <div
        className={`rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
          hint
            ? "border-accent bg-accent text-ink"
            : active
              ? "border-paper bg-paper text-ink"
              : "border-border bg-bg/80 text-paper"
        }`}
      >
        {hint ? `Tap ${label}` : label}
      </div>
    </Html>
  );
}

function FloorPeople({ count, y, seed }: { count: number; y: number; seed: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <FloorWalker key={i} index={i} count={count} y={y} seed={seed} />
      ))}
    </group>
  );
}

function FloorWalker({ index, count, y, seed }: { index: number; count: number; y: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * (0.22 + (seed % 3) * 0.04) + (index / Math.max(1, count)) * Math.PI * 2;
    const rx = 1.5;
    const rz = 1.1;
    ref.current.position.set(Math.cos(t) * rx, y, Math.sin(t) * rz);
    ref.current.rotation.y = -t + Math.PI / 2;
    ref.current.position.y = y + Math.abs(Math.sin(s.clock.elapsedTime * 7 + index)) * 0.04;
  });
  const color = index % 3 === 0 ? SAGE : index % 3 === 1 ? COPPER : PAPER;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <capsuleGeometry args={[0.1, 0.26, 3, 6]} />
        <meshStandardMaterial color={color} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={PAPER} />
      </mesh>
    </group>
  );
}

function CampusWalker({ offset, speed, color }: { offset: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const at = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((s) => {
    const t = (s.clock.elapsedTime * speed + offset) % 1;
    ROAD.getPointAt(t, at);
    ROAD.getPointAt((t + 0.012) % 1, look);
    if (!ref.current) return;
    ref.current.position.copy(at);
    ref.current.lookAt(look.x, at.y, look.z);
    ref.current.position.y = 0.42 + Math.abs(Math.sin(s.clock.elapsedTime * 8 + offset * 10)) * 0.05;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.3, 3, 6]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color={PAPER} />
      </mesh>
    </group>
  );
}

function Car({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const at = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((s) => {
    const t = (s.clock.elapsedTime * 0.018 + offset) % 1;
    ROAD.getPointAt(t, at);
    ROAD.getPointAt((t + 0.016) % 1, look);
    if (!ref.current) return;
    ref.current.position.set(at.x, 0.28, at.z);
    ref.current.lookAt(look.x, 0.28, look.z);
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[0.9, 0.32, 0.48]} position={[0, 0.1, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.22, 0.44]} position={[-0.05, 0.32, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color="#1a1a18" />
      </RoundedBox>
    </group>
  );
}

function Trees() {
  const spots: [number, number][] = [
    [-12, 3],
    [-11, -6],
    [12, -5],
    [13, 3],
    [-4, 14],
    [5, 14],
    [-13, -11],
    [14, -11],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <Tree key={i} position={[x, 0, z]} phase={i} />
      ))}
    </group>
  );
}

function Tree({ position, phase }: { position: [number, number, number]; phase: number }) {
  const crown = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (crown.current) crown.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.05 + phase) * 0.07;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 1.2, 6]} />
        <meshStandardMaterial color="#4a372c" />
      </mesh>
      <mesh ref={crown} position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.85, 1.8, 7]} />
        <meshStandardMaterial color="#3d5a48" />
      </mesh>
    </group>
  );
}

function CoinFountain({ origin }: { origin: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!group.current) return;
    const t = s.clock.elapsedTime;
    group.current.children.forEach((ch, i) => {
      const u = (t * 0.42 + i / 14) % 1;
      ch.position.set(Math.cos(i * 1.7) * 0.45, 2.4 + u * 2.6, Math.sin(i * 1.7) * 0.45);
      ch.rotation.y = t * 2.2 + i;
      const mesh = ch as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - u;
    });
  });
  return (
    <group ref={group} position={origin}>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 12]} />
          <meshStandardMaterial color={COPPER} emissive={COPPER} emissiveIntensity={0.55} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

export function TitleCampus() {
  const dummy = useMemo(() => {
    const s = createGame("Helix Ridge", 11);
    const extra: Employee[] = Array.from({ length: 7 }, (_, i) => ({
      id: `t-${i}`,
      roleId: i % 2 === 0 ? "gpu" : "hype",
      name: "Staff",
      hiredOn: 0,
      morale: 72,
    }));
    return {
      ...s,
      lastRound: "seed" as const,
      gpus: { h100: 6, b200: 2, gb200: 0 },
      employees: [...s.employees, ...extra],
      products: [
        {
          id: "p0",
          modelId: "m0",
          kind: "chat" as const,
          name: "Helix Chat",
          users: 4200,
          price: 18,
          quality: 44,
          adUntil: 0,
          adDaily: 0,
        },
      ],
      trainPct: 40,
    };
  }, []);
  return <CampusMap state={dummy} selected={null} onSelect={() => {}} preview />;
}

export function MapCopy({ state }: { state: GameState }) {
  const d = derive(state);
  return stageCopy(d.stage);
}
