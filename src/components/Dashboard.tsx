import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { JournalInteraction } from '../types';
import {
  getUserInteractions,
  saveUserInteraction,
  deleteUserInteraction,
} from '../lib/journalService';
import { Sidebar } from './Sidebar';
import { JournalEditor } from './JournalEditor';
import { LogOut, User as UserIcon, Shield, Menu, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const userId = userProfile?.uid || '';

  // Load user's interactions on mount
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setErrorBanner(null);
      try {
        const data = await getUserInteractions(userId);
        if (isMounted) {
          setInteractions(data);
          if (data.length > 0 && !activeId) {
            setActiveId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load user reflections:', err);
        if (isMounted) {
          setErrorBanner('Could not load past reflections: ' + (err.message || 'Firestore error'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleCreateNew = () => {
    const newId = 'ref-' + Date.now();
    const newInteraction: JournalInteraction = {
      id: newId,
      userId,
      title: 'New Reflection',
      preview: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turns: [],
    };

    setInteractions((prev) => [newInteraction, ...prev]);
    setActiveId(newId);
    setMobileMenuOpen(false);

    // Save initial placeholder
    saveUserInteraction(userId, newInteraction).catch((err) => {
      console.warn('Initial save warning:', err);
    });
  };

  const handleSelectInteraction = (id: string) => {
    setActiveId(id);
    setMobileMenuOpen(false);
  };

  const handleDeleteInteraction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this reflection?')) return;

    try {
      await deleteUserInteraction(userId, id);
      const remaining = interactions.filter((i) => i.id !== id);
      setInteractions(remaining);
      if (activeId === id) {
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      alert('Failed to delete interaction: ' + err.message);
    }
  };

  const handleSaveInteraction = async (updated: JournalInteraction) => {
    if (!userId) return;
    setSaving(true);
    try {
      await saveUserInteraction(userId, updated);
      setInteractions((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err: any) {
      console.error('Error saving interaction:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const activeInteraction = interactions.find((i) => i.id === activeId);

  return (
    <div id="dashboard-root" className="h-screen w-screen flex flex-col bg-[#050505] text-[#d1d1d1] overflow-hidden selection:bg-[#f27d26]/30">
      {/* Top Application Bar */}
      <header id="dashboard-nav" className="h-14 bg-[#0c0c0c] border-b border-[#1e1e1e] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-[#141414] hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#111111] text-[#f27d26] border border-[#1e1e1e] flex items-center justify-center font-serif italic text-sm shadow-[0_0_10px_rgba(242,125,38,0.15)]">
              G
            </div>
            <span className="font-serif italic font-medium text-white text-sm hidden sm:inline">
              Gemini Journal
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111111] border border-[#1e1e1e] text-[10px] font-mono text-gray-400">
            <Shield className="w-3 h-3 text-[#f27d26]" />
            <span>User Isolated ({userId.slice(0, 6)}...)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-[#222222] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#141414] border border-[#222222] text-gray-300 flex items-center justify-center font-mono">
                <UserIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <span className="hidden md:inline font-medium text-gray-200">
              {userProfile?.displayName || userProfile?.email || 'Authenticated User'}
            </span>
          </div>

          <button
            id="signout-button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-gray-400 hover:bg-[#141414] hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Error alert if load failed */}
      {errorBanner && (
        <div className="bg-[#1c1209] border-b border-[#f27d26]/40 p-2.5 text-center text-xs text-[#f27d26]">
          {errorBanner}
        </div>
      )}

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full">
          <Sidebar
            interactions={interactions}
            activeInteractionId={activeId}
            onSelectInteraction={handleSelectInteraction}
            onNewInteraction={handleCreateNew}
            onDeleteInteraction={handleDeleteInteraction}
            isLoading={loading}
          />
        </div>

        {/* Mobile Slide-over Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-4/5 max-w-xs h-full bg-[#0c0c0c] border-r border-[#1e1e1e] z-40">
              <Sidebar
                interactions={interactions}
                activeInteractionId={activeId}
                onSelectInteraction={handleSelectInteraction}
                onNewInteraction={handleCreateNew}
                onDeleteInteraction={handleDeleteInteraction}
                isLoading={loading}
              />
            </div>
          </div>
        )}

        {/* Editor or Empty State */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
          {activeInteraction ? (
            <JournalEditor
              key={activeInteraction.id}
              interaction={activeInteraction}
              onSave={handleSaveInteraction}
              isSaving={saving}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <h3 className="font-serif italic text-lg text-white">No Reflection Selected</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                Choose an existing reflection from the sidebar, or create a new journal entry to begin conversing with Gemini.
              </p>
              <button
                id="empty-state-new-button"
                onClick={handleCreateNew}
                className="mt-4 px-4 py-2 bg-white text-black hover:bg-[#f27d26] hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Create New Reflection
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
