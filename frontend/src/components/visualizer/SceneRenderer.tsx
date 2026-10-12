import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Array3D } from './scenes/Array3D';
import { SortingBars3D } from './scenes/SortingBars3D';
import { Stack3D } from './scenes/Stack3D';
import { CallStack3D } from './scenes/CallStack3D';
import { LinkedList3D } from './scenes/LinkedList3D';
import { Tree3D } from './scenes/Tree3D';
import { ExecutionEvent, VisualizationPlan } from '../../types';
import { Box, BarChart3, Layers, GitBranch, RefreshCw, Eye, Maximize2 } from 'lucide-react';

interface SceneRendererProps {
  currentEvent?: ExecutionEvent | null;
  detectedStructures?: string[];
  totalSteps?: number;
  allEvents?: ExecutionEvent[];
  visualizationPlan?: VisualizationPlan | null;
}

export type SceneMode = 'auto' | 'array' | 'bars' | 'stack' | 'tree' | 'linked_list';

interface AutoFitCameraProps {
  elementsCount: number;
  effectiveMode: SceneMode;
  controlsRef: React.RefObject<any>;
  fitTrigger: number;
}

const AutoFitCamera: React.FC<AutoFitCameraProps> = ({
  elementsCount,
  effectiveMode,
  controlsRef,
  fitTrigger,
}) => {
  const { camera, size } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 2.5, 9.5));
  const isInteracting = useRef(false);
  const prevFitTrigger = useRef(fitTrigger);

  // When user actively drags with OrbitControls, let them control
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      isInteracting.current = true;
    };
    const onEnd = () => {
      // Re-enable smooth auto-adaptation after a brief pause
      setTimeout(() => {
        isInteracting.current = false;
      }, 2500);
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [controlsRef]);

  // If user clicks Reset View or Fit, force instant reframing
  useEffect(() => {
    if (fitTrigger !== prevFitTrigger.current) {
      prevFitTrigger.current = fitTrigger;
      isInteracting.current = false;
    }
  }, [fitTrigger]);

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.2);

    let contentWidth = 7.5;
    let contentHeight = 4.2;

    if (effectiveMode === 'bars') {
      contentWidth = Math.max((elementsCount - 1) * 1.3 + 2.2, 7.5);
      contentHeight = 5.8;
    } else if (effectiveMode === 'stack') {
      contentWidth = 7.5;
      contentHeight = 5.5;
    } else if (effectiveMode === 'tree') {
      contentWidth = 9.0;
      contentHeight = 6.0;
    } else {
      // Array mode: elements spacing 1.45 + margins
      contentWidth = Math.max((elementsCount - 1) * 1.45 + 2.2, 7.0);
      contentHeight = 4.2;
    }

    // Comfortable 35% margin so elements never touch the edge of the viewport
    const margin = 1.35;
    const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
    const zForHeight = (contentHeight * margin) / (2 * tanHalfFov);
    const zForWidth = (contentWidth * margin) / (2 * tanHalfFov * aspect);
    const targetZ = Math.max(zForHeight, zForWidth, 7.5);
    const targetY = targetZ * 0.22; // subtle isometric angle down

    targetPos.current.set(0, targetY, targetZ);

    if (!isInteracting.current) {
      camera.position.lerp(targetPos.current, 0.15);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.15);
        controlsRef.current.update();
      }
    }
  });

  return null;
};

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  currentEvent,
  detectedStructures = [],
  totalSteps = 0,
  allEvents = [],
  visualizationPlan = null,
}) => {
  const [userMode, setUserMode] = useState<SceneMode>('auto');
  const [fitTrigger, setFitTrigger] = useState<number>(0);
  const controlsRef = useRef<any>(null);

  // Determine active visualizer mode
  let effectiveMode: SceneMode = userMode;
  if (userMode === 'auto') {
    if (visualizationPlan?.primaryVisualization) {
      const p = visualizationPlan.primaryVisualization;
      if (p === 'sorting_bars') effectiveMode = 'bars';
      else if (p === 'call_stack_tree') effectiveMode = 'stack';
      else if (p === 'linked_list') effectiveMode = 'linked_list';
      else if (p === 'tree') effectiveMode = 'tree';
      else effectiveMode = 'array';
    } else {
      if (detectedStructures.includes('sorting')) {
        effectiveMode = 'bars';
      } else if (detectedStructures.includes('recursion')) {
        effectiveMode = 'stack';
      } else if (detectedStructures.includes('tree')) {
        effectiveMode = 'tree';
      } else if (detectedStructures.includes('linked_list')) {
        effectiveMode = 'linked_list';
      } else {
        effectiveMode = 'array';
      }
    }
  }

  // Extract array/data structure and pointer mapping from currentEvent, or fallback
  const rawDataStructures = currentEvent?.dataStructures || {};
  const dataStructures: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawDataStructures)) {
    if (!k.startsWith('_')) {
      dataStructures[k] = v;
    }
  }

  let arrayEntries = Object.entries(dataStructures);
  if (arrayEntries.length === 0 && allEvents.length > 0) {
    for (const ev of allEvents) {
      if (ev.dataStructures && Object.keys(ev.dataStructures).length > 0) {
        const found = Object.entries(ev.dataStructures).find(
          ([k, arr]) => !k.startsWith('_') && (Array.isArray(arr) || (arr && typeof arr === 'object' && ((arr as any).__isMap || (arr as any).__isPair)))
        );
        if (found) {
          arrayEntries = [found];
          break;
        }
      }
    }
  }
  const primaryArray = arrayEntries.length > 0 ? arrayEntries[0] : null;
  const rawData = primaryArray ? primaryArray[1] : [10, 20, 30, 40, 50, 60, 70];
  const arrayName = primaryArray ? primaryArray[0] : 'arr';

  // Format arrayData if it's a map or pair object
  let arrayData: any[] = [];
  if (Array.isArray(rawData)) {
    arrayData = rawData;
  } else if (rawData && typeof rawData === 'object') {
    if (rawData.__isMap) {
      arrayData = (rawData.entries || []).map((e: any) => `[${e.key}] = ${e.value}`);
    } else if (rawData.__isPair) {
      arrayData = [`first = ${rawData.first}`, `second = ${rawData.second}`];
    } else if (rawData.__isLinear && Array.isArray(rawData.elements)) {
      arrayData = rawData.elements;
    } else {
      arrayData = Object.values(rawData);
    }
  } else {
    arrayData = [10, 20, 30, 40, 50, 60, 70];
  }

  // Map variables that act as pointers / indices into the array
  const pointerIndices: Record<string, number> = {};
  if (currentEvent?.variables) {
    const pointerLikeNames = new Set([
      'low', 'high', 'mid', 'left', 'right', 'i', 'j', 'k', 'idx', 'p', 'start', 'end', 'head', 'tail'
    ]);
    for (const [vName, vVal] of Object.entries(currentEvent.variables)) {
      if (typeof vVal === 'number' && vVal >= 0 && vVal < arrayData.length) {
        if (pointerLikeNames.has(vName.toLowerCase())) {
          pointerIndices[vName] = vVal;
        }
      }
    }
  }

  const handleResetCamera = () => {
    setFitTrigger((prev) => prev + 1);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Compute which visualization modes are actually relevant to current code
  const availableModes = React.useMemo(() => {
    const list: { id: SceneMode; label: string; icon: any }[] = [
      { id: 'auto', label: 'Auto', icon: Eye },
    ];

    const hasArray =
      arrayEntries.length > 0 ||
      detectedStructures.includes('array') ||
      detectedStructures.includes('sorting');
    const hasSorting = detectedStructures.includes('sorting');
    const hasStack =
      detectedStructures.includes('recursion') ||
      detectedStructures.includes('stack') ||
      (currentEvent?.callStack && currentEvent.callStack.length > 1);
    const hasTree = detectedStructures.includes('tree') || detectedStructures.includes('graph');
    const hasLinkedList = detectedStructures.includes('linked_list');

    if (hasArray || (!hasStack && !hasTree && !hasLinkedList)) {
      list.push({ id: 'array', label: '3D Array', icon: Box });
    }
    if (hasSorting) {
      list.push({ id: 'bars', label: 'Sorting Bars', icon: BarChart3 });
    }
    if (hasStack) {
      list.push({ id: 'stack', label: 'Call Stack', icon: Layers });
    }
    if (hasTree) {
      list.push({ id: 'tree', label: 'Tree 3D', icon: GitBranch });
    }
    if (hasLinkedList) {
      list.push({ id: 'linked_list', label: 'Linked List', icon: GitBranch });
    }

    return list;
  }, [detectedStructures, currentEvent, arrayEntries.length]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-[#080d1a] overflow-hidden flex flex-col select-none rounded-xl border border-white/5">
      {/* Top Scene Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Dynamic Mode Switcher Tabs - Only visible for relevant structures */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 pointer-events-auto shadow-xl">
          {availableModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = userMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setUserMode(mode.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`Switch to ${mode.label} visualizer`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
                {mode.id === 'auto' && (
                  <span className="text-[10px] text-cyan-400 font-mono ml-0.5 opacity-80">
                    ({effectiveMode})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Camera Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg group"
            title="Automatically fit the entire 3D visualization into the view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Fit View</span>
          </button>
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg"
            title="Reset 3D Camera to default orientation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Floating Info Pill Bottom Left */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs text-slate-300 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {currentEvent
              ? `Step ${currentEvent.step}: ${currentEvent.description}`
              : 'Interactive 3D Stage • Ready for code execution'}
          </span>
        </div>
      </div>

      {/* 3D R3F Canvas with Adaptive Responsive Framing */}
      <div className="w-full h-full flex-1">
        <Canvas
          camera={{ position: [0, 2.5, 9.5], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          {/* Automatic Adaptive Camera Framing */}
          <AutoFitCamera
            elementsCount={arrayData.length}
            effectiveMode={effectiveMode}
            controlsRef={controlsRef}
            fitTrigger={fitTrigger}
          />

          {/* Ambient & Directional Lights */}
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00f0ff" />
          <pointLight position={[10, 10, -10]} intensity={0.5} color="#8b5cf6" />

          {/* Floor Grid */}
          <Grid
            renderOrder={-1}
            position={[0, -2.4, 0]}
            infiniteGrid
            cellSize={0.8}
            cellThickness={0.6}
            cellColor="#1e293b"
            sectionSize={3.2}
            sectionThickness={1.2}
            sectionColor="#334155"
            fadeDistance={25}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />

          {/* Conditional Scenes */}
          {effectiveMode === 'array' && (
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
              <Array3D
                data={arrayData}
                name={arrayName}
                activeIndices={currentEvent?.activeIndices || []}
                eventType={currentEvent?.eventType}
                pointerIndices={pointerIndices}
              />
            </Float>
          )}

          {effectiveMode === 'bars' && (
            <SortingBars3D
              data={arrayData}
              activeIndices={currentEvent?.activeIndices || []}
              comparingIndices={
                currentEvent?.comparisonOperands
                  ? Object.values(currentEvent.comparisonOperands)
                  : []
              }
              name={arrayName}
            />
          )}

          {effectiveMode === 'stack' && (
            <CallStack3D
              callStack={
                currentEvent?.callStack && currentEvent.callStack.length > 0
                  ? currentEvent.callStack
                  : [{ name: 'main', line: currentEvent?.line || 1 }]
              }
            />
          )}

          {effectiveMode === 'tree' && <Tree3D />}
          {effectiveMode === 'linked_list' && <LinkedList3D />}
        </Canvas>
      </div>
    </div>
  );
};
