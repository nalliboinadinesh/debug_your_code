import React, { useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { isGarbageValue, formatDisplayValue } from '../../../utils/dataStructures';

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

  // Detect if this is a Pair (e.g. `it` from `for (auto it : freq)`)
  const isPair =
    name === 'it' ||
    name.toLowerCase().includes('pair') ||
    (count === 2 && elements.some((e) => typeof e === 'string' && e.includes('first =')));

  // Check maximum string length for adaptive spacing
  const maxStrLen = elements.reduce((max, e) => {
    const s = formatDisplayValue(e);
    return Math.max(max, s.length);
  }, 0);

  // Adaptive spacing: pairs and wide content need wider spacing to prevent collision
  const spacing = isPair
    ? 2.8
    : maxStrLen > 4
    ? 2.4
    : count > 8
    ? Math.max(1.3, 11 / count)
    : 1.55;

  const totalWidth = (elements.length - 1) * spacing;
  const startX = -totalWidth / 2;

  // Title formatting
  const displayTitle = isPair
    ? `Pair: ${name}`
    : `Array: ${name}[${elements.length}]`;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Title above array */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.45}
        color={isPair ? '#c084fc' : '#38bdf8'}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {displayTitle}
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

        // Check if uninitialized garbage
        const isGarbage = isGarbageValue(val);

        // Pair item formatting: separate label and clean value
        let cellLabel = `[${idx}]`;
        let cellVal = formatDisplayValue(val, '');

        if (isPair) {
          const rawStr = String(val ?? '');
          if (rawStr.includes('first =')) {
            cellLabel = 'first';
            cellVal = rawStr.replace('first =', '').trim();
          } else if (rawStr.includes('second =')) {
            cellLabel = 'second';
            cellVal = rawStr.replace('second =', '').trim();
          } else {
            cellLabel = idx === 0 ? 'first' : 'second';
          }
        }

        // Adaptive font sizing to guarantee text never bleeds outside the box
        const textLen = Math.max(cellVal.length, 1);
        const fontSize = Math.max(0.24, Math.min(0.48, 1.4 / textLen));

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

            {/* Value text inside/above cell - Suppressed if garbage */}
            <Text
              position={[0, 0, 0.62]}
              fontSize={fontSize}
              color={isGarbage ? '#64748b' : textColor}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {isGarbage ? '—' : cellVal}
            </Text>

            {/* Sub-label below cell (Index or Pair Member) */}
            <Text
              position={[0, -1.0, 0]}
              fontSize={0.3}
              color={isPair ? '#c084fc' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              fontWeight={isPair ? 'bold' : 'normal'}
            >
              {cellLabel}
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
