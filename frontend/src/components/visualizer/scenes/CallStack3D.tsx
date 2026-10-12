import React from 'react';
import { Text } from '@react-three/drei';
import { CallStackFrame } from '../../../types';

interface CallStack3DProps {
  callStack: CallStackFrame[];
}

export const CallStack3D: React.FC<CallStack3DProps> = ({ callStack = [] }) => {
  const frames = Array.isArray(callStack) ? callStack : [];
  const frameHeight = 0.9;
  const startY = -1.5;

  return (
    <group position={[0, 0, 0]}>
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.42}
        color="#a855f7"
        anchorX="center"
        anchorY="middle"
      >
        {`Runtime Call Stack (${frames.length} Frame${frames.length === 1 ? '' : 's'})`}
      </Text>

      {frames.map((frame, idx) => {
        // Reverse so deepest is at top or current executing frame is at top
        const yPos = startY + idx * (frameHeight + 0.2) + frameHeight / 2;
        const isCurrent = idx === 0; // Top of call stack

        return (
          <group key={idx} position={[0, yPos, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4.2, frameHeight, 1.6]} />
              <meshStandardMaterial
                color={isCurrent ? '#8b5cf6' : '#1e293b'}
                emissive={isCurrent ? '#8b5cf6' : '#000000'}
                emissiveIntensity={isCurrent ? 0.4 : 0}
              />
            </mesh>

            <Text
              position={[-1.7, 0, 0.85]}
              fontSize={0.34}
              color={isCurrent ? '#ffffff' : '#e2e8f0'}
              anchorX="left"
              anchorY="middle"
              fontWeight="bold"
            >
              {`${frame.name}()`}
            </Text>

            <Text
              position={[1.7, 0, 0.85]}
              fontSize={0.28}
              color={isCurrent ? '#f1f5f9' : '#94a3b8'}
              anchorX="right"
              anchorY="middle"
            >
              {`line ${frame.line}`}
            </Text>

            {isCurrent && (
              <group position={[2.8, 0, 0]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.32}
                  color="#c084fc"
                  anchorX="left"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  ◀ active
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
