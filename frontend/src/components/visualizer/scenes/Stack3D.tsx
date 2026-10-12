import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Stack3DProps {
  elements: any[];
  title?: string;
  name?: string;
}

export const Stack3D: React.FC<Stack3DProps> = ({
  elements = [],
  title = 'Stack (LIFO)',
  name = 'stack',
}) => {
  const items = Array.isArray(elements) ? elements : [];
  const itemHeight = 0.8;
  const startY = -1.8;

  return (
    <group position={[0, 0, 0]}>
      {/* Title */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.42}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {`${title}: ${name}`}
      </Text>

      {/* Stack Base Plate */}
      <mesh position={[0, startY - 0.2, 0]}>
        <boxGeometry args={[3.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Stack side rails */}
      <mesh position={[-1.6, startY + 1.8, 0]}>
        <boxGeometry args={[0.1, 4, 2.2]} />
        <meshStandardMaterial color="#334155" opacity={0.3} transparent />
      </mesh>
      <mesh position={[1.6, startY + 1.8, 0]}>
        <boxGeometry args={[0.1, 4, 2.2]} />
        <meshStandardMaterial color="#334155" opacity={0.3} transparent />
      </mesh>

      {items.length === 0 && (
        <Text
          position={[0, startY + 0.8, 0]}
          fontSize={0.32}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          (Stack Empty)
        </Text>
      )}

      {items.map((val, idx) => {
        const yPos = startY + idx * (itemHeight + 0.15) + itemHeight / 2;
        const isTop = idx === items.length - 1;

        return (
          <group key={idx} position={[0, yPos, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.8, itemHeight, 1.8]} />
              <meshStandardMaterial
                color={isTop ? '#00f0ff' : '#1e293b'}
                emissive={isTop ? '#00f0ff' : '#000000'}
                emissiveIntensity={isTop ? 0.4 : 0}
              />
            </mesh>

            <Text
              position={[0, 0, 0.95]}
              fontSize={0.38}
              color={isTop ? '#080b11' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {String(val)}
            </Text>

            {isTop && (
              <group position={[2.2, 0, 0]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.35}
                  color="#00f0ff"
                  anchorX="left"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  ◀ top
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
