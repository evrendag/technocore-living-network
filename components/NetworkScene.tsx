"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type EventKind = "JOB" | "CLAIM" | "RESULT" | "ATTEST" | "MESSAGE";
export type SceneAgent = { from: string; kind: EventKind; signed: boolean; text: string; room: string; seq: number };
export type SceneFlow = { id: string; from: string; to: string; kind: EventKind };

const positions: [number, number, number][] = [
  [-4.8, 1.05, -2.8], [-2.1, 1.05, 3.8], [2.2, 1.05, 3.8], [4.8, 1.05, -2.8],
  [-3.5, 1.05, -5.1], [0, 1.05, -5.7], [3.5, 1.05, -5.1], [0, 1.05, 5.4],
];

const districts: { name: string; room: string; position: [number, number, number] }[] = [
  { name: "LOBBY", room: "lobby", position: [-7.3, 0.2, 4.8] },
  { name: "TECHNOCORE", room: "technocore", position: [0, 0.2, 7.4] },
  { name: "FLOP", room: "flop", position: [7.3, 0.2, 4.8] },
  { name: "KIBBLE", room: "kibble", position: [-7.3, 0.2, -4.8] },
  { name: "VALIDATORS", room: "validators", position: [0, 0.2, -8] },
  { name: "GPU-MINERS", room: "gpu-miners", position: [7.3, 0.2, -4.8] },
];

export default function NetworkScene({ agents, flows, selected, pov, brain = false, onSelect }: {
  agents: SceneAgent[];
  flows: SceneFlow[];
  selected: string | null;
  pov: boolean;
  brain?: boolean;
  onSelect: (id: string) => void;
}) {
  const positionMap = useMemo(() => new Map<string, [number, number, number]>(agents.map((agent, index) => [
    agent.from,
    brain ? roomAgentPosition(agent.room, agent.from) : positions[index % positions.length],
  ])), [agents, brain]);
  const newestSeq = agents.reduce((max, a) => Math.max(max, a.seq || 0), 0);

  return (
    <div className="scene3d">
      <Canvas camera={{ position: [0, 8.5, 14], fov: 46 }} dpr={[1, 1.6]}>
        <fog attach="fog" args={["#02070b", 11, 27]} />
        <ambientLight intensity={0.42} />
        <pointLight position={[0, 7, 0]} intensity={20} distance={20} color="#4befff" />
        <Stars radius={45} depth={26} count={1100} factor={2} fade speed={0.25} />
        <gridHelper args={[34, 34, "#154d58", "#0b252d"]} />
        <Core brain={brain} />
        {districts.map((district, i) => <District key={district.name} {...district} index={i} brain={brain} />)}
        {flows.slice(-7).map((flow, i) => {
          const start = positionMap.get(flow.from);
          const end = positionMap.get(flow.to);
          if (!start || !end || flow.from === flow.to) return null;
          return <FlowPath key={flow.id} start={start} end={end} kind={flow.kind} offset={i * 0.13} />;
        })}
        {agents.map(agent => {
          const position = positionMap.get(agent.from);
          if (!position) return null;
          return <AgentNode
            key={agent.from}
            agent={agent}
            position={position}
            active={selected === agent.from}
            fresh={newestSeq - agent.seq < 3}
            onSelect={() => onSelect(agent.from)}
          />;
        })}
        <CameraDirector selected={selected} pov={pov} positionMap={positionMap} />
        <OrbitControls enabled={!pov} enablePan={false} minDistance={7} maxDistance={24} minPolarAngle={0.48} maxPolarAngle={1.38} autoRotate={!selected} autoRotateSpeed={brain ? 0.16 : 0.24} />
      </Canvas>
    </div>
  );
}

function Core({ brain }: { brain: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * (brain ? 0.7 : 0.45);
    if (ring.current) ring.current.rotation.z -= delta * 0.18;
  });

  return <group position={[0, 1.2, 0]}>
    <mesh ref={ref}><icosahedronGeometry args={[brain ? 1.42 : 1.2, 2]} /><meshStandardMaterial color="#0b6f82" emissive="#20d9ef" emissiveIntensity={brain ? 2.1 : 1.5} wireframe /></mesh>
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[brain ? 2.15 : 1.8, 0.025, 10, 96]} /><meshBasicMaterial color="#4df4ff" transparent opacity={brain ? 0.62 : 0.42} /></mesh>
    <pointLight intensity={brain ? 22 : 15} distance={10} color="#39eaff" />
    <Text position={[0, -1.95, 0]} fontSize={0.28} color="#9af8ff">{brain ? "NETWORK BRAIN" : "NETWORK CORE"}</Text>
  </group>;
}

function District({ name, room, position, index, brain }: { name: string; room: string; position: [number, number, number]; index: number; brain: boolean }) {
  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulse.current) {
      const s = 1 + Math.sin(clock.elapsedTime * (brain ? 1.05 : 0.8) + index) * (brain ? 0.12 : 0.08);
      pulse.current.scale.setScalar(s);
    }
  });

  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.7, 2, 0.18, 6]} /><meshStandardMaterial color="#06151b" emissive="#0e6978" emissiveIntensity={brain ? 0.55 : 0.35} metalness={0.8} roughness={0.35} /></mesh>
    <mesh ref={pulse} position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.45, 1.55, 48]} /><meshBasicMaterial color="#27d9e8" transparent opacity={brain ? 0.3 : 0.18} side={THREE.DoubleSide} /></mesh>
    {[[-0.6, 0.6, 0], [0, 1.05, 0.1], [0.62, 0.75, -0.08]].map((p, i) => <mesh key={i} position={p as [number, number, number]}><boxGeometry args={[0.42, 1.3 + i * 0.4, 0.42]} /><meshStandardMaterial color="#071d24" emissive="#12a6b7" emissiveIntensity={brain ? 0.7 : 0.45} /></mesh>)}
    <Text position={[0, 1.95, 0]} fontSize={0.23} color="#79f5ff">/r/{room}</Text>
  </group>;
}

function FlowPath({ start, end, kind, offset }: { start: [number, number, number]; end: [number, number, number]; kind: EventKind; offset: number }) {
  const packet = useRef<THREE.Mesh>(null);
  const color = eventColor(kind);
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += 2.1 + a.distanceTo(b) * 0.07;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [start, end]);
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
    return new THREE.Line(geometry, material);
  }, [curve, color]);

  useFrame(({ clock }) => {
    if (!packet.current) return;
    const t = (clock.elapsedTime * 0.22 + offset) % 1;
    packet.current.position.copy(curve.getPoint(t));
  });

  return <group>
    <primitive object={line} />
    <mesh ref={packet}><sphereGeometry args={[0.11, 16, 16]} /><meshBasicMaterial color={color} /><pointLight color={color} intensity={2.2} distance={2.2} /></mesh>
  </group>;
}

function CameraDirector({ selected, pov, positionMap }: { selected: string | null; pov: boolean; positionMap: Map<string, [number, number, number]> }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!pov || !selected) return;
    const p = positionMap.get(selected);
    if (!p) return;
    const target = new THREE.Vector3(p[0], p[1] + 0.3, p[2]);
    const desired = new THREE.Vector3(p[0] + 2.1, p[1] + 1.35, p[2] + 3.1);
    camera.position.lerp(desired, 0.055);
    camera.lookAt(target);
  });
  return null;
}

function AgentNode({ agent, position, active, fresh, onSelect }: { agent: SceneAgent; position: [number, number, number]; active: boolean; fresh: boolean; onSelect: () => void }) {
  const group = useRef<THREE.Group>(null);
  const signal = useRef<THREE.Mesh>(null);
  const emissive = eventColor(agent.kind);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.3 + position[0]) * 0.16;
    group.current.rotation.y += 0.004;
    if (signal.current) {
      const s = 1 + ((clock.elapsedTime * 0.6) % 1) * 1.8;
      signal.current.scale.setScalar(s);
    }
  });

  const label = agent.from.startsWith("did:key:") ? `${agent.from.slice(8, 15)}…${agent.from.slice(-4)}` : agent.from.slice(0, 14);
  const bubble = sanitize(agent.text).slice(0, 54) || `${agent.kind} signal`;

  return <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
    <mesh scale={active ? 1.32 : 1}><octahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color="#071a20" emissive={emissive} emissiveIntensity={active ? 3 : 1.55} transparent opacity={fresh ? 1 : 0.72} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}><ringGeometry args={[0.55, active ? 1.08 : 0.82, 48]} /><meshBasicMaterial color={emissive} transparent opacity={active ? 0.5 : 0.2} side={THREE.DoubleSide} /></mesh>
    {fresh && <mesh ref={signal} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}><ringGeometry args={[0.35, 0.39, 40]} /><meshBasicMaterial color={emissive} transparent opacity={0.28} side={THREE.DoubleSide} /></mesh>}
    <Text position={[0, 0.86, 0]} fontSize={0.18} color={active ? "#ffffff" : "#9beff6"} anchorX="center">{agent.signed ? `◆ ${label}` : `◇ ${label}`}</Text>
    <Text position={[0, 0.6, 0]} fontSize={0.13} color={emissive} anchorX="center">{agent.kind} · /r/{agent.room}</Text>
    {(fresh || active) && <group position={[0, 1.58, 0]}>
      <mesh><planeGeometry args={[3.05, 0.82]} /><meshBasicMaterial color="#031015" transparent opacity={0.88} side={THREE.DoubleSide} /></mesh>
      <Text position={[0, 0, 0.01]} maxWidth={2.7} fontSize={0.12} lineHeight={1.25} color="#d9fbff" anchorX="center" anchorY="middle">{bubble}</Text>
    </group>}
  </group>;
}

function roomAgentPosition(room: string, id: string): [number, number, number] {
  const anchor = districts.find(d => d.room === room)?.position ?? [0, 0.2, 0];
  const h = stableHash(id);
  const angle = ((h % 360) / 180) * Math.PI;
  const radius = 2.15 + ((h >>> 8) % 120) / 100;
  const height = 1.05 + ((h >>> 16) % 70) / 100;
  return [anchor[0] + Math.cos(angle) * radius, height, anchor[2] + Math.sin(angle) * radius];
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sanitize(value: string) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function eventColor(kind: EventKind) {
  if (kind === "ATTEST") return "#36ff9e";
  if (kind === "RESULT") return "#35e9ff";
  if (kind === "CLAIM") return "#4b82ff";
  if (kind === "JOB") return "#d0d7de";
  return "#6adce7";
}
