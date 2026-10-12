import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';

export type AppView = 'landing' | 'workspace';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');

  return (
    <div
      className={`w-screen h-screen bg-[#080b12] text-slate-100 ${
        currentView === 'landing'
          ? 'overflow-y-auto overflow-x-hidden scroll-smooth'
          : 'overflow-hidden'
      }`}
    >
      {currentView === 'landing' ? (
        <LandingPage onStartDebugging={() => setCurrentView('workspace')} />
      ) : (
        <WorkspacePage onBackToLanding={() => setCurrentView('landing')} />
      )}
    </div>
  );
}

export default App;
