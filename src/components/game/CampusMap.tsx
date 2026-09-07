import { ContactShadows, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { createGame, derive } from "@/game/engine";
import { stageCopy } from "@/game/content";
import { money } from "@/game/format";
import { IsoFallback } from "./IsoFallback";
import type { Employee, GameState, Stage, TabId } from "@/game/types";

const SKY = "#6eb5d6";
const GRASS = "#4f9e3e";
const GRASS_DK = "#3d8230";
const DIRT = "#c4a574";
const ROAD_COL = "#6a6864";
const PLAZA = "#d9cbb0";
const PAPER = "#f2efe6";
const INK = "#1c1a16";
const SAGE = "#5a9e6a";
const TERRACOTTA = "#d4785a";
const BRICK = "#c45c4a";
const CREAM = "#efe6d4";
const STEEL = "#6a7a88";
const STEEL_DK = "#3d4a56";
const WOOD = "#8a6a4a";
const CRIMSON = "#c45c4a";
const WATER = "#4aa3c4";
const GLASS = "#b7d4c8";

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
};

const LOTS: Lot[] = [
  { tab: "lab", label: "Lab", pos: [-5.4, 0, 4.6], size: [5.4, 2.8, 4.8] },
  { tab: "cluster", label: "GPUs", pos: [5.6, 0, 4.2], size: [6.2, 3.2, 5.4] },
  { tab: "store", label: "Shop", pos: [0.1, 0, 9.0], size: [4.8, 2.4, 3.8] },
  { tab: "crew", label: "People", pos: [-5.6, 0, -4.8], size: [5.2, 3.8, 4.6] },
  { tab: "floor", label: "HQ", pos: [5.2, 0, -5.0], size: [5.6, 4.6, 5.0] },
  { tab: "shadow", label: "Dark", pos: [-11.2, 0, 0.2], size: [3.4, 1.8, 3.4] },
];

const ROAD = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-13, 0.14, 9),
    new THREE.Vector3(3, 0.14, 13),
    new THREE.Vector3(14, 0.14, 6),
    new THREE.Vector3(13, 0.14, -9),
    new THREE.Vector3(-2, 0.14, -13),
    new THREE.Vector3(-14, 0.14, -4),
    new THREE.Vector3(-13.5, 0.14, 5),
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
  const [mode, setMode] = useState<"gl" | "iso">("gl");
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl =
        c.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
        c.getContext("webgl", { failIfMajorPerformanceCaveat: false });
      if (!gl) setMode("iso");
    } catch {
      setMode("iso");
    }
  }, []);
  if (mode === "iso") {
    return (
      <IsoFallback
        selected={selected}
        onSelect={onSelect}
        preview={preview}
        company={state.company}
        hintTab={derive(state).hintTab}
        earning={derive(state).revenue}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <MapError
        fallback={
          <IsoFallback
            selected={selected}
            onSelect={onSelect}
            preview={preview}
            company={state.company}
            hintTab={derive(state).hintTab}
            earning={derive(state).revenue}
          />
        }
      >
        <Canvas
          className="map-canvas h-full w-full"
          shadows
          dpr={[1, 1.35]}
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}
          camera={{ position: preview ? [13, 12, 14] : [12, 13, 12], fov: 42, near: 0.2, far: 120 }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(SKY, 1);
            gl.shadowMap.type = THREE.PCFShadowMap;
            scene.background = new THREE.Color(SKY);
          }}
          style={{ background: SKY, touchAction: "none" }}
        >
          <fog attach="fog" args={[SKY, 58, 110]} />
          <hemisphereLight args={["#fff6dc", GRASS_DK, 0.62]} />
          <ambientLight intensity={0.38} />
          <directionalLight
            castShadow
            position={[16, 24, 10]}
            intensity={1.55}
            color="#fff6e0"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={2}
            shadow-camera-far={60}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <World state={state} selected={selected} onSelect={onSelect} preview={preview} />
          <ContactShadows opacity={0.28} scale={56} blur={2.4} far={14} color="#2a3a22" />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minPolarAngle={0.72}
            maxPolarAngle={1.08}
            minDistance={preview ? 14 : 10}
            maxDistance={32}
            autoRotate={preview}
            autoRotateSpeed={0.38}
            target={[0, 0.8, 0]}
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
  const walkers = Math.min(preview ? 9 : 12, Math.max(5, state.employees.length + 4));
  const hint = selected ?? d.hintTab;

  return (
    <group>
      <Ground rank={rank} />
      <Fountain />
      <Clouds />
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
          revenue={d.revenue}
        />
      ))}
      {rank >= 4 && <Pavilion />}
      {rank >= 5 && <Spire listed={state.listed} />}
      {Array.from({ length: walkers }).map((_, i) => (
        <CampusWalker
          key={i}
          offset={i / walkers}
          speed={0.016 + (i % 4) * 0.003}
          color={i % 3 === 0 ? "#4a7c59" : i % 3 === 1 ? "#c4785a" : PAPER}
        />
      ))}
      <Car offset={0} color={CRIMSON} />
      <Car offset={0.38} color="#3d5a4a" />
      {rank >= 2 && <Car offset={0.7} color={STEEL_DK} />}
      <Trees />
      {d.revenue > 4 && <CoinFountain origin={LOTS[2]!.pos} />}
    </group>
  );
}

function FocusRig({ selected }: { selected: TabId | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  const goal = useMemo(() => new THREE.Vector3(0, 0.8, 0), []);
  const camGoal = useMemo(() => new THREE.Vector3(12, 13, 12), []);
  useFrame((_, raw) => {
    if (!controls) return;
    const dt = Math.min(raw, 0.1);
    const lot = LOTS.find((f) => f.tab === selected);
    if (lot) {
      goal.set(lot.pos[0], lot.size[1] * 0.4, lot.pos[2]);
      camGoal.set(lot.pos[0] + 7.6, lot.size[1] + 6.8, lot.pos[2] + 7.6);
    } else {
      goal.set(0, 0.8, 0);
      camGoal.set(12, 13, 12);
    }
    controls.target.lerp(goal, 1 - Math.exp(-3.2 * dt));
    if (lot) camera.position.lerp(camGoal, 1 - Math.exp(-1.6 * dt));
    controls.update();
  });
  return null;
}

function Ground({ rank }: { rank: number }) {
  const patches: [number, number, number][] = [
    [-8, 0.015, 8],
    [9, 0.015, -7],
    [-10, 0.015, -8],
    [8, 0.015, 9],
    [0, 0.015, -11],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#6eb5d6" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial color={GRASS} roughness={0.92} />
      </mesh>
      {patches.map(([x, y, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} receiveShadow>
          <circleGeometry args={[3.2 + (i % 3) * 0.6, 16]} />
          <meshStandardMaterial color={i % 2 ? GRASS_DK : "#78c262"} roughness={0.95} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[3.4, 32]} />
        <meshStandardMaterial color={PLAZA} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]} receiveShadow>
        <ringGeometry args={[11.2, 13.2, 48]} />
        <meshStandardMaterial color={ROAD_COL} roughness={0.9} />
      </mesh>
      {LOTS.map((lot) => (
        <mesh key={lot.tab} rotation={[-Math.PI / 2, 0, 0]} position={[lot.pos[0], 0.04, lot.pos[2]]} receiveShadow>
          <planeGeometry args={[lot.size[0] + 1.8, lot.size[2] + 1.8]} />
          <meshStandardMaterial color={DIRT} roughness={0.9} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9.6, 0.045, 6.4]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={ROAD_COL} roughness={0.88} />
      </mesh>
      {rank >= 3 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9.5, 0.04, 8.5]} receiveShadow>
          <planeGeometry args={[6, 4.4]} />
          <meshStandardMaterial color="#7a9e55" roughness={0.9} />
        </mesh>
      )}
      <HedgeStrip />
    </group>
  );
}

function HedgeStrip() {
  const spots: [number, number][] = [
    [-2.2, 2.4],
    [2.2, 2.4],
    [2.4, -2.2],
    [-2.4, -2.2],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <RoundedBox key={i} args={[1.6, 0.55, 0.45]} position={[x, 0.32, z]} radius={0.08} castShadow>
          <meshStandardMaterial color={GRASS_DK} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (water.current) water.current.rotation.y = s.clock.elapsedTime * 0.45;
  });
  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[1.55, 1.75, 0.28, 16]} />
        <meshStandardMaterial color={PLAZA} roughness={0.7} />
      </mesh>
      <mesh ref={water} position={[0, 0.34, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.08, 16]} />
        <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.15} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.72, 8]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={WATER} emissive={WATER} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, raw) => {
    if (group.current) group.current.rotation.y += Math.min(raw, 0.1) * 0.012;
  });
  const spots: [number, number, number, number][] = [
    [-14, 16, -6, 2.4],
    [12, 17, -10, 2.8],
    [-6, 15.5, 16, 2.2],
    [16, 14.5, 8, 1.8],
  ];
  return (
    <group ref={group}>
      {spots.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[s, 10, 10]} />
          <meshStandardMaterial color="#f7fbff" roughness={1} />
        </mesh>
      ))}
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
  revenue,
}: {
  lot: Lot;
  state: GameState;
  rank: number;
  cards: number;
  selected: boolean;
  hinted: boolean;
  onSelect: (tab: TabId) => void;
  preview: boolean;
  revenue: number;
}) {
  const wrap = useRef<THREE.Group>(null);
  const [w, h, d] = lot.size;
  useFrame((st) => {
    if (!wrap.current) return;
    const bounce = hinted ? 1 + Math.sin(st.clock.elapsedTime * 4.4) * 0.055 : selected ? 1.015 : 1;
    wrap.current.scale.set(1, bounce, 1);
  });

  return (
    <group position={lot.pos}>
      <group ref={wrap}>
        <BuildingMesh lot={lot} state={state} />
        <group position={[0, 0.12, 0]} scale={Math.min(w, d) / 6.2}>
          <Interior tab={lot.tab} state={state} rank={rank} cards={cards} />
        </group>
        {!preview && <FloorPeople count={peopleOn(lot.tab, state)} y={0.42} seed={w + h} />}
      </group>
      <SelectRing on={selected} radius={Math.max(w, d) * 0.62} />
      <GlowPad on={hinted} radius={Math.max(w, d) * 0.74} />
      <TapArrow on={hinted} height={h} />
      <BuildingLabel
        label={lot.label}
        height={h}
        active={selected || hinted}
        hint={hinted}
        extra={lot.tab === "store" && revenue > 8 ? `${money(revenue)}/d` : null}
      />
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
        <boxGeometry args={[w + 1.1, h + 1.2, d + 1.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function BuildingMesh({ lot, state }: { lot: Lot; state: GameState }) {
  const [w, h, d] = lot.size;
  if (lot.tab === "lab") return <LabMesh w={w} h={h} d={d} training={!!state.training} />;
  if (lot.tab === "cluster") return <GpuMesh w={w} h={h} d={d} />;
  if (lot.tab === "store") return <ShopMesh w={w} h={h} d={d} live={state.products.length > 0} />;
  if (lot.tab === "crew") return <CrewMesh w={w} h={h} d={d} />;
  if (lot.tab === "floor") return <HqMesh w={w} h={h} d={d} listed={state.listed} />;
  return <DarkMesh w={w} h={h} d={d} hot={state.evil > 6} />;
}

function Windows({
  w,
  h,
  d,
  cols,
  rows,
  color,
  emissive,
}: {
  w: number;
  h: number;
  d: number;
  cols: number;
  rows: number;
  color: string;
  emissive: string;
}) {
  const panes: { p: [number, number, number]; rot: [number, number, number] }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = -w / 2 + 0.7 + c * ((w - 1.4) / Math.max(1, cols - 1));
      const v = 0.65 + r * ((h - 1.05) / Math.max(1, rows));
      panes.push({ p: [u, v, d / 2 + 0.04], rot: [0, 0, 0] });
      if (c % 2 === 0) panes.push({ p: [w / 2 + 0.04, v, u * (d / w) * 0.35], rot: [0, Math.PI / 2, 0] });
    }
  }
  return (
    <group>
      {panes.map((pane, i) => (
        <mesh key={i} position={pane.p} rotation={pane.rot}>
          <boxGeometry args={[0.46, 0.5, 0.06]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.35 + (i % 3) * 0.08}
            roughness={0.22}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function LabMesh({ w, h, d, training }: { w: number; h: number; d: number; training: boolean }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={TERRACOTTA} roughness={0.72} />
      </RoundedBox>
      <mesh position={[-w * 0.2, h + 0.55, 0]} rotation={[0, 0, 0.48]} castShadow>
        <boxGeometry args={[w * 0.55, 0.14, d * 0.96]} />
        <meshStandardMaterial color={BRICK} />
      </mesh>
      <mesh position={[w * 0.2, h + 0.55, 0]} rotation={[0, 0, -0.48]} castShadow>
        <boxGeometry args={[w * 0.55, 0.14, d * 0.96]} />
        <meshStandardMaterial color={BRICK} />
      </mesh>
      <mesh position={[w * 0.28, h + 1.15, -d * 0.18]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 1.2, 8]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
      <RoundedBox args={[1.8, 1.4, 1.6]} position={[w * 0.42, 0.8, d * 0.42]} radius={0.06} castShadow>
        <meshStandardMaterial color={GLASS} transparent opacity={0.72} emissive={SAGE} emissiveIntensity={training ? 0.45 : 0.12} />
      </RoundedBox>
      <Windows w={w} h={h} d={d} cols={4} rows={2} color={GLASS} emissive={training ? SAGE : PAPER} />
      {training && <pointLight position={[0, h + 1.3, 0]} color={SAGE} intensity={1.5} distance={9} />}
    </group>
  );
}

function GpuMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.06} castShadow receiveShadow>
        <meshStandardMaterial color={STEEL} roughness={0.45} metalness={0.28} />
      </RoundedBox>
      <RoundedBox args={[w + 0.4, 0.28, d + 0.4]} position={[0, h + 0.1, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={STEEL_DK} metalness={0.3} />
      </RoundedBox>
      {[-1.6, 0, 1.6].map((x) => (
        <RoundedBox key={x} args={[1.15, 0.4, 0.85]} position={[x, h + 0.42, 0.35]} radius={0.05} castShadow>
          <meshStandardMaterial color={STEEL_DK} metalness={0.4} />
        </RoundedBox>
      ))}
      <mesh position={[0, h * 0.55, d / 2 + 0.08]}>
        <boxGeometry args={[w * 0.82, 0.22, 0.1]} />
        <meshStandardMaterial color="#3ad0c0" emissive="#3ad0c0" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <Windows w={w} h={h} d={d} cols={5} rows={2} color="#1a2428" emissive="#3ad0c0" />
      <pointLight position={[0, h + 0.9, 0]} color="#7fe0d4" intensity={0.7} distance={7} />
    </group>
  );
}

function ShopMesh({ w, h, d, live }: { w: number; h: number; d: number; live: boolean }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={CREAM} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[w + 0.3, 0.2, d + 0.3]} position={[0, h + 0.08, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={BRICK} />
      </RoundedBox>
      <mesh position={[0, h * 0.62, d / 2 + 0.4]} castShadow>
        <boxGeometry args={[w * 0.94, 0.1, 0.8]} />
        <meshStandardMaterial color={live ? SAGE : CRIMSON} />
      </mesh>
      <mesh position={[0, h * 0.82, d / 2 + 0.06]}>
        <boxGeometry args={[w * 0.7, 0.55, 0.08]} />
        <meshStandardMaterial color={INK} emissive={live ? SAGE : PAPER} emissiveIntensity={live ? 0.55 : 0.12} />
      </mesh>
      {[-1.1, 1.1].map((x) => (
        <RoundedBox key={x} args={[0.7, 0.35, 0.7]} position={[x, 0.22, d / 2 + 0.7]} radius={0.04} castShadow>
          <meshStandardMaterial color={WOOD} />
        </RoundedBox>
      ))}
      <Windows w={w} h={h} d={d} cols={3} rows={1} color={GLASS} emissive={live ? SAGE : PAPER} />
      {live && <pointLight position={[0, h * 0.75, d / 2 + 0.5]} color={SAGE} intensity={0.9} distance={6} />}
    </group>
  );
}

function CrewMesh({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={CREAM} roughness={0.68} />
      </RoundedBox>
      <RoundedBox args={[w + 0.25, 0.2, d + 0.25]} position={[0, h + 0.08, 0]} radius={0.04} castShadow>
        <meshStandardMaterial color={STEEL} />
      </RoundedBox>
      {[-1.4, 0, 1.4].map((x, i) => (
        <RoundedBox key={x} args={[1.1, 0.12, 0.55]} position={[x, 1.4 + (i % 2) * 1.15, d / 2 + 0.22]} radius={0.03} castShadow>
          <meshStandardMaterial color={WOOD} />
        </RoundedBox>
      ))}
      <Windows w={w} h={h} d={d} cols={4} rows={3} color={GLASS} emissive={PAPER} />
    </group>
  );
}

function HqMesh({ w, h, d, listed }: { w: number; h: number; d: number; listed: boolean }) {
  return (
    <group>
      <RoundedBox args={[w, h * 0.55, d]} position={[0, h * 0.28, 0]} radius={0.08} castShadow receiveShadow>
        <meshStandardMaterial color={PAPER} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[w * 0.72, h * 0.55, d * 0.72]} position={[0, h * 0.72, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color={CREAM} roughness={0.5} />
      </RoundedBox>
      <Windows w={w} h={h * 0.55} d={d} cols={4} rows={2} color={GLASS} emissive={listed ? SAGE : PAPER} />
      {listed && <Flag position={[w * 0.28, h, d * 0.28]} />}
    </group>
  );
}

function DarkMesh({ w, h, d, hot }: { w: number; h: number; d: number; hot: boolean }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.05} castShadow receiveShadow>
        <meshStandardMaterial color="#2a2622" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, h + 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 6]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
      <mesh position={[0, h * 0.55, d / 2 + 0.05]}>
        <boxGeometry args={[0.7, 0.55, 0.08]} />
        <meshStandardMaterial color={INK} emissive={hot ? CRIMSON : STEEL} emissiveIntensity={hot ? 0.8 : 0.15} />
      </mesh>
      {hot && <pointLight position={[0, h + 0.4, 0]} color={CRIMSON} intensity={0.9} distance={5} />}
    </group>
  );
}

function peopleOn(tab: TabId, state: GameState) {
  if (tab === "crew") return Math.min(8, Math.max(2, state.employees.length));
  if (tab === "lab") return state.training ? 4 : 2;
  if (tab === "cluster") return Math.min(4, 1 + Math.floor((state.gpus.h100 + state.gpus.b200) / 4));
  if (tab === "store") return state.products.length ? Math.min(7, 3 + Math.floor(state.users / 3500)) : 1;
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
    if (glow.current) glow.current.intensity = training ? 1.3 + Math.sin(s.clock.elapsedTime * 4.4) * 0.45 : 0.25;
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
        <meshStandardMaterial ref={mat} color={INK} emissive={train ? SAGE : STEEL} metalness={0.28} roughness={0.38} />
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
        <meshStandardMaterial color={INK} emissive={listed ? SAGE : STEEL} emissiveIntensity={0.35} />
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
    <group position={[-11, 0, 8]}>
      <RoundedBox args={[4.2, 1.8, 3.4]} position={[0, 0.9, 0]} radius={0.08} castShadow>
        <meshStandardMaterial color={CREAM} />
      </RoundedBox>
      <RoundedBox args={[4.6, 0.16, 3.8]} position={[0, 1.86, 0]} radius={0.04}>
        <meshStandardMaterial color={SAGE} />
      </RoundedBox>
    </group>
  );
}

function Spire({ listed }: { listed: boolean }) {
  return (
    <group position={[0, 0, -13]}>
      <RoundedBox args={[2.4, 9.5, 2.4]} position={[0, 4.75, 0]} radius={0.06} castShadow>
        <meshStandardMaterial color={PAPER} metalness={0.1} roughness={0.4} />
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
      <meshBasicMaterial color={PAPER} transparent opacity={0.9} />
    </mesh>
  );
}

function GlowPad({ on, radius }: { on: boolean; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.visible = on;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = on ? 0.22 + Math.sin(s.clock.elapsedTime * 3.2) * 0.1 : 0;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial color={PAPER} transparent opacity={0.22} />
    </mesh>
  );
}

function TapArrow({ on, height }: { on: boolean; height: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.visible = on;
    if (!on) return;
    const t = s.clock.elapsedTime;
    ref.current.position.y = height + 2.35 + Math.sin(t * 3.6) * 0.38;
  });
  return (
    <group ref={ref} position={[0, height + 2.35, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.48, 1.05, 8]} />
        <meshStandardMaterial color={PAPER} emissive={PAPER} emissiveIntensity={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.7, 8]} />
        <meshStandardMaterial color={PAPER} emissive={PAPER} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}

function BuildingLabel({
  label,
  height,
  active,
  hint,
  extra,
}: {
  label: string;
  height: number;
  active: boolean;
  hint: boolean;
  extra: string | null;
}) {
  return (
    <Html position={[0, height + 2.05, 0]} center distanceFactor={26} style={{ pointerEvents: "none" }}>
      <div
        className={`rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
          hint
            ? "border-paper bg-paper text-ink"
            : active
              ? "border-paper bg-paper text-ink"
              : "border-border bg-bg/80 text-paper"
        }`}
      >
        {hint ? `Tap ${label}` : extra ? extra : label}
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
    ref.current.position.set(Math.cos(t) * 1.5, y + Math.abs(Math.sin(s.clock.elapsedTime * 7 + index)) * 0.04, Math.sin(t) * 1.1);
    ref.current.rotation.y = -t + Math.PI / 2;
  });
  const color = index % 3 === 0 ? "#4a7c59" : index % 3 === 1 ? "#c4785a" : PAPER;
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
    const t = (s.clock.elapsedTime * 0.02 + offset) % 1;
    ROAD.getPointAt(t, at);
    ROAD.getPointAt((t + 0.016) % 1, look);
    if (!ref.current) return;
    ref.current.position.set(at.x, 0.28, at.z);
    ref.current.lookAt(look.x, 0.28, look.z);
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[0.95, 0.34, 0.5]} position={[0, 0.1, 0]} radius={0.05} castShadow>
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
    [-12, 3.2],
    [-11.2, -6.4],
    [12.4, -5.2],
    [13.2, 3.4],
    [-4.2, 14.2],
    [5.4, 14.4],
    [-13.2, -11],
    [14.2, -11.2],
    [0.2, -9.6],
    [-8.4, 11.2],
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
        <meshStandardMaterial color="#6a4a32" />
      </mesh>
      <mesh ref={crown} position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.95, 8, 8]} />
        <meshStandardMaterial color={phase % 2 ? "#4a9a48" : "#3d8a40"} />
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
      const u = (t * 0.48 + i / 16) % 1;
      ch.position.set(Math.cos(i * 1.7) * 0.5, 2.5 + u * 2.8, Math.sin(i * 1.7) * 0.5);
      ch.rotation.y = t * 2.4 + i;
      const mesh = ch as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - u;
    });
  });
  return (
    <group ref={group} position={origin}>
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i}>
          <cylinderGeometry args={[0.12, 0.12, 0.045, 12]} />
          <meshStandardMaterial color={PAPER} emissive={PAPER} emissiveIntensity={0.55} transparent opacity={1} />
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
          modelId: s.models[0]?.id ?? "m0",
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
