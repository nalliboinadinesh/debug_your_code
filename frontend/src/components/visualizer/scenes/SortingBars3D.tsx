import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface SortingBars3DProps {
  data: number[];
  activeIndices?: number[];
  comparingIndices?: number[];
  name?: string;
}

export const SortingBars3D: React.FC<SortingBars3DProps> = ({
  data = [],
  activeIndices = [],
  comparingIndices = [],
  name = 'arr',
}) => {
  const elements = Array.isArray(data) ? data : [];
  const maxVal = Math.max(...elements.map((v) => (typeof v === 'number' ? v : 1)), 10);
  const spacing = 1.3;
  const totalWidth = (elements.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <group position={[0, -1.5, 0]}>
      {/* Title */}
      <Text
        position={[0, 4.2, 0]}
        fontSize={0.45}
        color="#818cf8"
        anchorX="center"
        anchorY="middle"
      >
        {`Sorting Bars View: ${name}`}
      </Text>

      {elements.map((val, idx) => {
        const numVal = typeof val === 'number' ? val : 1;
        const height = Math.max((numVal / maxVal) * 3.5, 0.4);
        const isActive = activeIndices.includes(idx);
        const isComparing = comparingIndices.includes(idx);
        const xPos = startX + idx * spacing;

        const barColor = isActive
          ? '#f59e0b' // Amber/orange active/swap
          : isComparing
          ? '#00f0ff' // Cyan comparing
          : '#334155'; // Muted dark slate

        return (
          <group key={idx} position={[xPos, 0, 0]}>
            {/* 3D Vertical Bar */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.9, height, 0.9]} />
              <meshStandardMaterial
                color={barColor}
                metalness={0.2}
                roughness={0.2}
                emissive={isActive ? '#f59e0b' : isComparing ? '#00f0ff' : '#000000'}
                emissiveIntensity={isActive || isComparing ? 0.5 : 0}
              />
            </mesh>

            {/* Value text above bar */}
            <Text
              position={[0, height + 0.4, 0]}
              fontSize={0.35}
              color={isActive ? '#f59e0b' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {String(val)}
            </Text>

            {/* Index label below bar */}
            <Text
              position={[0, -0.4, 0]}
              fontSize={0.28}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {`[${idx}]`}
            </Text>
          </group>
        );
      })}
    </group>
  );
};
