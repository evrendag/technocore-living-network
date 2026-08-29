"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type EventKind = "JOB" | "CLAIM" | "RESULT" | "ATTEST" | "MESSAGE";
export type SceneAgent = { from: string; kind: EventKind; signed: boolean };

const positions: [number, number, number][] = [
  [-4, 1, -2], [-2, 1, 3], [2, 1, 3], [4, 1, -2],
  [-3, 1, -5], [0, 1, -5], [3, 1, -5], [0, 1, 5],
];

export default function NetworkScene({ agents, selected, onSelect }: {
  agents: SceneAgent[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scene3d">
      <Canvas camera={{ position: [0, 8, 13], fov: 46 }} dpr={[1, 1.6]}>
        <fog attach="fog" args={["#02070b", 9, 24]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[0, 6, 0]} intensity={18} distance={18} color="#4befff" />
        <Stars radius={40} depth={24} count={900} factor={2} fade speed={0.25} />
        <gridHelper args={[30, 30, "#154d58", "#0b252d"]} />
        <Core />
        {agents.map((agent, index) => (
          <AgentNode
            key={agent.from}
            agent={agent}
            position={positions[index % positions.length]}
            active={selected === agent.from}
            onSelect={() => onSelect(agent.from)}
          />
        ))}
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={20}
          minPolarAngle={0.55}
          maxPolarAngle={1.35}
          autoRotate={!selected}
          autoRotateSpeed={0.28}
        />
      </Canvas>
    </div>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.45;
  });
  return (
    <group position={[0, 1, 0]}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#0b6f82" emissive="#20d9ef" emissiveIntensity={1.4} wireframe />
      </mesh>
      <pointLight intensity={12} distance={8} color="#39eaff" />
      <Text position={[0, -1.8, 0]} fontSize={0.28} color="#9af8ff">NETWORK CORE</Text>
    </group>
  );
}

function AgentNode({ agent, position, active, onSelect }: {
  agent: SceneAgent;
  position: [number, number, number];
  active: boolean;
  onSelect: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const emissive = useMemo(() => {
    if (agent.kind === "ATTEST") return "#36ff9e";
    if (agent.kind === "RESULT") return "#35e9ff";
    if (agent.kind === "CLAIM") return "#4b82ff";
    if (agent.kind === "JOB") return "#d0d7de";
    return "#6adce7";
  }, [agent.kind]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.3 + position[0]) * 0.16;
    group.current.rotation.y += 0.004;
  });

  const label = agent.from.startsWith("did:key:")
    ? `${agent.from.slice(8, 15)}…${agent.from.slice(-4)}`
    : agent.from.slice(0, 14);

  return (
    <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh scale={active ? 1.28 : 1}>
        <octahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial color="#071a20" emissive={emissive} emissiveIntensity={active ? 2.7 : 1.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <ringGeometry args={[0.55, active ? 1.05 : 0.8, 48]} />
        <meshBasicMaterial color={emissive} transparent opacity={active ? 0.45 : 0.18} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 0.82, 0]} fontSize={0.18} color={active ? "#ffffff" : "#9beff6"} anchorX="center">
        {agent.signed ? `◆ ${label}` : `◇ ${label}`}
      </Text>
      <Text position={[0, 0.57, 0]} fontSize={0.13} color={emissive} anchorX="center">
        {agent.kind}
      </Text>
    </group>
  );
}
