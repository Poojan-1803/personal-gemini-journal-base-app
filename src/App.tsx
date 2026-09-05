import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div id="loading-screen" className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-[#d1d1d1]">
        <div className="w-10 h-10 rounded-xl bg-[#0c0c0c] border border-[#1e1e1e] text-[#f27d26] flex items-center justify-center font-serif italic text-lg shadow-[0_0_20px_rgba(242,125,38,0.15)] animate-pulse mb-3">
          G
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-mono text-stone-500">Initializing secure session...</p>
      </div>
    );
  }

  return currentUser ? <Dashboard /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
