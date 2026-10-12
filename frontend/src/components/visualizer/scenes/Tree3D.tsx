import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TreeNodeData {
  val: number | string;
  x: number;
  y: number;
  active?: boolean;
  children?: TreeNodeData[];
}

export const Tree3D: React.FC = () => {
  // Balanced binary search tree layout
  const nodes = [
    { val: 8, x: 0, y: 1.8, active: true },
    { val: 4, x: -2.2, y: 0.5, active: true },
    { val: 12, x: 2.2, y: 0.5, active: false },
    { val: 2, x: -3.2, y: -0.8, active: true },
    { val: 6, x: -1.2, y: -0.8, active: false },
    { val: 10, x: 1.2, y: -0.8, active: false },
    { val: 14, x: 3.2, y: -0.8, active: false },
  ];

  const edges = [
    { from: [0, 1.8], to: [-2.2, 0.5], active: true },
    { from: [0, 1.8], to: [2.2, 0.5], active: false },
    { from: [-2.2, 0.5], to: [-3.2, -0.8], active: true },
    { from: [-2.2, 0.5], to: [-1.2, -0.8], active: false },
    { from: [2.2, 0.5], to: [1.2, -0.8], active: false },
    { from: [2.2, 0.5], to: [3.2, -0.8], active: false },
  ];

  return (
    <group position={[0, 0, 0]}>
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.42}
        color="#10b981"
        anchorX="center"
        anchorY="middle"
      >
        Tree / Graph Search (DFS Traversal)
      </Text>

      {/* Render Edges */}
      {edges.map((e, idx) => {
        const p1 = new THREE.Vector3(e.from[0], e.from[1], 0);
        const p2 = new THREE.Vector3(e.to[0], e.to[1], 0);
        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);

        return (
          <line key={idx}>
            <bufferGeometry attach="geometry" {...lineGeo} />
            <lineBasicMaterial
              attach="material"
              color={e.active ? '#10b981' : '#334155'}
              linewidth={e.active ? 2.5 : 1}
            />
          </line>
        );
      })}

      {/* Render Nodes */}
      {nodes.map((n, idx) => {
        return (
          <group key={idx} position={[n.x, n.y, 0]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.55, 32, 32]} />
              <meshStandardMaterial
                color={n.active ? '#10b981' : '#1e293b'}
                emissive={n.active ? '#10b981' : '#000000'}
                emissiveIntensity={n.active ? 0.5 : 0}
              />
            </mesh>

            <Text
              position={[0, 0, 0.6]}
              fontSize={0.38}
              color={n.active ? '#080b11' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {String(n.val)}
            </Text>
          </group>
        );
      })}
    </group>
  );
};
