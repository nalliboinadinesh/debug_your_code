import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LinkedList3DProps {
  nodes?: any[];
  activeIdx?: number;
}

export const LinkedList3D: React.FC<LinkedList3DProps> = ({
  nodes = [3, 8, 1, 9, 4],
  activeIdx = 3,
}) => {
  const items = Array.isArray(nodes) && nodes.length > 0 ? nodes : [3, 8, 1, 9, 4];
  const spacing = 2.0;
  const totalWidth = (items.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <group position={[0, 0, 0]}>
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.42}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        Linked List (Singly Linked Nodes)
      </Text>

      {items.map((val, idx) => {
        const xPos = startX + idx * spacing;
        const isActive = idx === activeIdx;

        return (
          <group key={idx} position={[xPos, 0, 0]}>
            {/* Node Box */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.2, 1.0, 1.0]} />
              <meshStandardMaterial
                color={isActive ? '#00f0ff' : '#1e293b'}
                emissive={isActive ? '#00f0ff' : '#000000'}
                emissiveIntensity={isActive ? 0.45 : 0}
              />
            </mesh>

            {/* Value */}
            <Text
              position={[0, 0, 0.55]}
              fontSize={0.42}
              color={isActive ? '#080b11' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {String(val)}
            </Text>

            {/* Connecting Pointer Arrow to next node */}
            {idx < items.length - 1 && (
              <group position={[0.6, 0, 0]}>
                {/* Arrow stem */}
                <mesh position={[0.4, 0, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
                  <meshStandardMaterial color="#64748b" />
                </mesh>
                {/* Arrow head */}
                <mesh position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.12, 0.25, 8]} />
                  <meshStandardMaterial color="#00f0ff" />
                </mesh>
              </group>
            )}

            {/* Active pointer label below */}
            {isActive && (
              <group position={[0, -1.1, 0]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.35}
                  color="#00f0ff"
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  ▲ current
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
