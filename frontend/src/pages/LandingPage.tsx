import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import { Array3D } from '../components/visualizer/scenes/Array3D';
import { DycLogo } from '../components/layout/DycLogo';
import {
  Play,
  Sparkles,
  Layers,
  Activity,
  Cpu,
  ArrowRight,
  Code2,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onStartDebugging: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartDebugging }) => {
  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToArchitecture = () => {
    document.getElementById('architecture-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#080b12]/80 border-b border-white/5 px-6 py-3.5 flex items-center justify-between">
        <DycLogo size="md" showWordmark />

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
          <button
            onClick={scrollToFeatures}
            className="hover:text-cyan-400 transition"
          >
            Features
          </button>
          <button
            onClick={scrollToHowItWorks}
            className="hover:text-cyan-400 transition"
          >
            How DYC Works
          </button>
          <button
            onClick={scrollToArchitecture}
            className="hover:text-cyan-400 transition"
          >
            Architecture
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartDebugging}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 group"
          >
            <span>Start Debugging</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 flex-1">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Left Content */}
        <div className="flex-1 space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>AI-Powered Dynamic 3D Code Visualizer</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-heading">
            Write Code. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
              Watch Every Step.
            </span>
          </h1>

          <p className="text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
            <strong className="text-white font-semibold">DebugYourCode (DYC)</strong>{' '}
            executes student C++ code in an isolated environment, captures genuine GDB runtime
            events, and transforms them into interactive 3D visualizations, variable diffs, and
            rigorous TC/SC analyses.
          </p>

          <p className="text-sm text-slate-400 max-w-lg">
            <span className="text-cyan-400 font-semibold">Tagline:</span> Write It. Run It. See It. Understand It.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
            <button
              onClick={onStartDebugging}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base transition shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Workspace IDE</span>
            </button>

            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-base transition flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-6 pt-4 text-xs text-slate-400 justify-center lg:justify-start">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Isolated Execution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Real GDB Trace</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Gemma 4 AI Tutor</span>
            </div>
          </div>
        </div>

        {/* Hero Right: Live 3D Interactive Demo */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none h-[380px] rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0c1222] border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 text-[11px] text-cyan-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Live 3D Array Scene (Try Dragging)</span>
          </div>

          <Canvas camera={{ position: [0, 2, 7], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 15, 10]} intensity={1.5} />
            <pointLight position={[-10, -5, -5]} color="#00f0ff" intensity={0.8} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.0} />
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
              <Array3D
                data={[7, 2, 9, 4, 6, 1]}
                name="arr"
                activeIndices={[1]}
                pointerIndices={{ 'i': 1 }}
              />
            </Float>
          </Canvas>

          <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded bg-black/60 text-[10px] text-slate-400 font-mono">
            Element a[1] = 2 highlighted
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features-section" className="py-20 bg-[#060910] border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white font-heading">
              Engineered for Deep DSA Comprehension
            </h2>
            <p className="text-sm text-slate-400">
              Not canned animations. Every frame is dynamically computed from user code compilation and debugger stepping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-cyan-500/20 hover:border-cyan-500/50 transition duration-300 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white font-heading">
                Dynamic C++ Execution
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Submit raw C++ code. The backend compiles with <code className="text-cyan-400">g++ -g3</code>, steps with GDB, and captures genuine runtime states.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-violet-500/20 hover:border-violet-500/50 transition duration-300 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white font-heading">
                Interactive 3D Stage
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Three.js & React Three Fiber canvas renders arrays, sorting bars, stacks, recursion frames, and trees in full 3D space with controllable orbit camera.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-emerald-500/20 hover:border-emerald-500/50 transition duration-300 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white font-heading">
                Static TC / SC Analysis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                AST-based asymptotic analyzer explains loop strides (e.g. <code className="text-emerald-400">i += 2</code>), triangular bounds, and auxiliary memory proofs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-amber-500/20 hover:border-amber-500/50 transition duration-300 space-y-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white font-heading">
                Dual AI Tutor Profiles
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose between Gemma 4 and Open-weight coding LLM. Explains exact execution states and grades interactive student predictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works-section" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white font-heading">
            How DebugYourCode Works
          </h2>
          <p className="text-sm text-slate-400">
            A secure 4-stage pipeline turns raw student code into deep visual and analytical understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Write or Paste C++',
              desc: 'Type loops, arrays, pointers, or select curated DSA presets in the Monaco Editor.',
            },
            {
              step: '02',
              title: 'Isolated Execution',
              desc: 'Sandboxed runner compiles your code and steps with GDB, capturing real memory values.',
            },
            {
              step: '03',
              title: '3D Scene Transformation',
              desc: 'Normalized events drive responsive 3D blocks, pointer movements, and call stack frames.',
            },
            {
              step: '04',
              title: 'Inspect & Learn with AI',
              desc: 'Step backward or forward, verify complexity derivations, and ask Gemma 4 to explain.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 relative"
            >
              <span className="text-2xl font-black text-cyan-400 font-mono block">
                {item.step}
              </span>
              <h4 className="font-bold text-white text-base">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ARCHITECTURE SECTION */}
      <section
        id="architecture-section"
        className="py-20 bg-[#060a14] border-t border-white/5 px-6 relative overflow-hidden"
      >
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-14 relative z-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>System Architecture & Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-heading">
              Deterministic GDB Runtime Meets 3D Graphics
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              DebugYourCode rejects fabricated traces. Every visual block, variable value, and stack
              frame is captured by an isolated GDB debugger engine running in real time.
            </p>
          </div>

          {/* Architecture Pipeline Flow Diagram */}
          <div className="p-6 rounded-2xl bg-[#090f1e]/80 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-4 h-4" />
                <span>Real-Time Execution Pipeline</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Deterministic • Zero Hallucination • Safe Sandbox
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-[#0e1628] border border-cyan-500/30 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div className="text-xs font-bold text-white">Student Code</div>
                <div className="text-[11px] text-slate-400 font-mono">Monaco C++17</div>
              </div>

              <div className="hidden md:flex justify-center text-cyan-400">
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-[#0e1628] border border-blue-500/30 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <div className="text-xs font-bold text-white">GCC + GDB Runner</div>
                <div className="text-[11px] text-slate-400 font-mono">WSL2 / Linux Engine</div>
              </div>

              <div className="hidden md:flex justify-center text-cyan-400">
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-[#0e1628] border border-emerald-500/30 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <div className="text-xs font-bold text-white">Normalized Events</div>
                <div className="text-[11px] text-slate-400 font-mono">Variables & Stack Frames</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="p-3 rounded-lg bg-[#0c1220] border border-violet-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-xs">
                  3D
                </div>
                <div>
                  <div className="text-xs font-bold text-violet-300">Three.js / R3F Canvas</div>
                  <div className="text-[11px] text-slate-400">
                    Live renders array blocks, sorting bars, recursion stacks, and trees
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0c1220] border border-amber-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">Gemma 4 AI Tutor + AST Analyzer</div>
                  <div className="text-[11px] text-slate-400">
                    Time/Space complexity proofs + interactive step explanations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Architectural Layers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layer 1: Workspace Client */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-cyan-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    1. Frontend Workspace Engine
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    React 18 • TypeScript • TailwindCSS • Three.js / R3F
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Monaco Editor:</strong> Synchronized line highlighting that follows debugger execution in lockstep.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Dynamic 3D Canvas:</strong> Real-time scene renderer that adapts automatically to detected data structures.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Time-Travel Controls:</strong> Step forward, backward, pause, or jump to any execution step.
                  </span>
                </li>
              </ul>
            </div>

            {/* Layer 2: Fast Backend Orchestration */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-violet-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    2. FastAPI Orchestration Layer
                  </h3>
                  <span className="text-[11px] text-violet-400 font-mono">
                    Python 3.11 • Uvicorn • Pydantic v2
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong><code className="text-violet-300">/api/run</code>:</strong> Dispatches code, compiles with <code className="text-violet-300">-g3 -O0</code>, runs GDB, and parses step traces.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong><code className="text-violet-300">/api/complexity</code>:</strong> AST parser derives rigorous Big-O bounds and stride proofs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong><code className="text-violet-300">/api/explain</code>:</strong> Prompts Gemma 4 with precise step state snapshots for pedagogical guidance.
                  </span>
                </li>
              </ul>
            </div>

            {/* Layer 3: Isolated GDB Sandbox */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-emerald-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    3. GDB Execution Sandbox
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    WSL2 / Ubuntu • GCC 11+ • Python GDB API
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Step-by-Step Interception:</strong> Custom GDB script evaluates <code className="text-emerald-300">info locals</code>, frame pointers, and arrays at each statement.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox Isolation:</strong> Strict execution timeouts, memory caps, and sandboxed file system paths.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Authentic Memory Values:</strong> No hallucinated outputs. Real pointers, address locations, and terminal stdout.
                  </span>
                </li>
              </ul>
            </div>

            {/* Layer 4: AI & Complexity Engine */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-amber-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    4. AI Pedagogical Engine
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Gemma 4 • Structured Step Evaluation • Socratic Explanations
                  </span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>State-Grounded Tutor:</strong> Understands exact variable mutations between step N and N+1.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Prediction Verification:</strong> Validates student predictions with immediate constructive feedback.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Complexity Proofs:</strong> Breaks down recurrence relations and outer/inner loop stride impacts.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto py-8 bg-[#05070d] border-t border-white/5 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <DycLogo size="sm" showWordmark />
          <div className="text-center sm:text-right">
            <p className="text-slate-400">
              DebugYourCode (DYC) • Write It. Run It. See It. Understand It.
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Built with React, TypeScript, Three.js, Monaco, FastAPI, and Gemma 4
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
