import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, Database, Bot, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, authError, clearAuthError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await loginWithGoogle();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div id="landing-page-root" className="min-h-screen bg-[#050505] text-[#d1d1d1] flex flex-col selection:bg-[#f27d26]/30">
      {/* Top Header */}
      <header id="landing-header" className="w-full border-b border-[#1e1e1e] bg-[#0c0c0c]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111111] text-[#f27d26] border border-[#1e1e1e] flex items-center justify-center font-serif italic text-lg shadow-[0_0_15px_rgba(242,125,38,0.15)]">
              G
            </div>
            <div>
              <span className="font-serif italic text-white text-base tracking-tight font-medium">Gemini Journal</span>
              <span className="ml-2.5 text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[#111111] text-gray-400 border border-[#1e1e1e]">
                Firestore
              </span>
            </div>
          </div>

          <button
            id="nav-signin-button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-semibold text-gray-300 bg-[#111111] hover:bg-[#1a1a1a] hover:text-[#f27d26] border border-[#1e1e1e] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main id="landing-main" className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 py-16 sm:py-24">
        {authError && (
          <div id="auth-error-banner" className="mb-8 p-4 rounded-xl bg-[#1c1209] border border-[#f27d26]/40 text-[#f27d26] flex items-start justify-between text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider">Authentication Notice</p>
              <p className="mt-1 text-gray-300 leading-relaxed">{authError}</p>
            </div>
            <button
              onClick={clearAuthError}
              className="text-[#f27d26] hover:text-[#ff4e00] font-semibold ml-4 text-[10px] uppercase tracking-widest underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0c0c] border border-[#1e1e1e] text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-6 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#f27d26]" />
            <span>Strict User-Isolated Storage with Cloud Firestore</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-white tracking-tight leading-[1.15]">
            Reflective Journaling with Gemini AI
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-400 font-normal leading-relaxed max-w-2xl mx-auto">
            A private space to write thoughts, brainstorm breakthroughs, and gain synthesis through multi-turn conversations with Gemini 3.6 Flash.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-signin-button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black hover:bg-[#f27d26] hover:text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-60"
            >
              {isSigningIn ? (
                <span>Connecting to Google...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#222222] text-[#f27d26] flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-lg text-white">Multi-Turn Reflections</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Explore your thoughts with Gemini 3.6 Flash. Ask follow-up questions, request deeper perspectives, or clarify decisions.
            </p>
          </div>

          <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#222222] text-[#f27d26] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-lg text-white">User-Isolated Firestore</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Every journal entry is saved strictly under your authenticated identity (`/users/$uid/interactions`). Cross-tenant access is blocked at the rule level.
            </p>
          </div>

          <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#222222] text-[#f27d26] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-lg text-white">Intelligent Summaries</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Generate automatic syntheses, identify emotional tones, and generate concise titles for each reflection to easily browse past archives.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-[#1e1e1e] flex flex-wrap items-center justify-center gap-8 text-[11px] uppercase tracking-widest text-gray-500 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f27d26]" />
            <span>Firebase Federated Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f27d26]" />
            <span>Zero Password Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f27d26]" />
            <span>Resilient Fallback Ladder</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f27d26]" />
            <span>Cloud Firestore Verified</span>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#1e1e1e] py-6 text-center text-[10px] uppercase tracking-[0.2em] text-gray-600">
        <p>Gemini Journal & Reflections &bull; Secured with Firebase & Gemini API</p>
      </footer>
    </div>
  );
};
