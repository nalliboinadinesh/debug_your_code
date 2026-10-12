import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Array3DProps {
  data: number[] | any[];
  name: string;
  activeIndices?: number[];
  eventType?: string;
  pointerIndices?: Record<string, number>;
}

export const Array3D: React.FC<Array3DProps> = ({
  data,
  name,
  activeIndices = [],
  eventType = '',
  pointerIndices = {},
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const elements = Array.isArray(data) ? data : [];
  const count = elements.length;
  // Adaptive spacing for optimal framing
  const spacing = count > 8 ? Math.max(1.2, 10 / count) : 1.45;
  const totalWidth = (elements.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Title above array */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.45}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {`Array: ${name}[${elements.length}]`}
      </Text>

      {elements.map((val, idx) => {
        const isActive = activeIndices.includes(idx);
        const xPos = startX + idx * spacing;
        
        // Pointers targeting this index (e.g. i, left, right, mid)
        const activePointerNames = Object.entries(pointerIndices)
          .filter(([_, targetIdx]) => targetIdx === idx)
          .map(([ptrName]) => ptrName);

        const isWrite = isActive && eventType === 'array_write';
        const boxColor = isWrite
          ? '#f59e0b' // Amber write
          : isActive
          ? '#00f0ff' // Cyan active
          : '#1e293b'; // Normal dark slate

        const textColor = isActive || isWrite ? '#080b11' : '#f8fafc';

        return (
          <group key={idx} position={[xPos, 0, 0]}>
            {/* 3D Cell Block */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 1.2, 1.2]} />
              <meshStandardMaterial
                color={boxColor}
                metalness={0.2}
                roughness={0.2}
                emissive={isActive ? '#00f0ff' : isWrite ? '#f59e0b' : '#000000'}
                emissiveIntensity={isActive || isWrite ? 0.45 : 0}
              />
            </mesh>

            {/* Glowing border outline */}
            <lineSegments position={[0, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(1.22, 1.22, 1.22)]} />
              <lineBasicMaterial
                color={isActive ? '#00f0ff' : '#334155'}
                linewidth={isActive ? 2 : 1}
              />
            </lineSegments>

            {/* Value text inside/above cell */}
            <Text
              position={[0, 0, 0.62]}
              fontSize={0.48}
              color={textColor}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {String(val ?? '?')}
            </Text>

            {/* Index label below cell */}
            <Text
              position={[0, -1.0, 0]}
              fontSize={0.3}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {`[${idx}]`}
            </Text>

            {/* Active pointer label below index */}
            {activePointerNames.length > 0 && (
              <group position={[0, -1.7, 0]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.35}
                  color="#22d3ee"
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  {`▲ ${activePointerNames.join(', ')}`}
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
