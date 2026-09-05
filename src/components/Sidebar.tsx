import React from 'react';
import { JournalInteraction } from '../types';
import { BookOpen, Plus, Sparkles, Trash2, Calendar } from 'lucide-react';

interface SidebarProps {
  interactions: JournalInteraction[];
  activeInteractionId: string | null;
  onSelectInteraction: (id: string) => void;
  onNewInteraction: () => void;
  onDeleteInteraction: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  interactions,
  activeInteractionId,
  onSelectInteraction,
  onNewInteraction,
  onDeleteInteraction,
  isLoading,
}) => {
  return (
    <aside
      id="journal-sidebar"
      className="w-full md:w-80 bg-[#0c0c0c] border-r border-[#1e1e1e] flex flex-col h-full select-none text-[#d1d1d1]"
    >
      {/* Action Header */}
      <div className="p-4 border-b border-[#1e1e1e] flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-4 h-4 text-[#f27d26]" />
          <span className="font-serif italic text-base font-medium">Reflections</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141414] text-gray-400 font-mono border border-[#1e1e1e]">
            {interactions.length}
          </span>
        </div>

        <button
          id="new-reflection-button"
          onClick={onNewInteraction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-[#f27d26] hover:text-white text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* List of past entries */}
      <div id="reflection-history-list" className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {isLoading && interactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">Loading reflections...</div>
        ) : interactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 leading-relaxed">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            No journal entries yet. Click "New Entry" above to start your first reflection with Gemini.
          </div>
        ) : (
          interactions.map((entry) => {
            const isActive = entry.id === activeInteractionId;
            const dateStr = entry.updatedAt
              ? new Date(entry.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectInteraction(entry.id)}
                className={`group relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#141414] border-[#262626] border-l-2 border-l-[#f27d26] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-transparent border-transparent hover:bg-[#111111] hover:border-[#1e1e1e]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-medium line-clamp-1 flex-1 ${isActive ? 'text-white font-serif italic' : 'text-gray-300 font-serif'}`}>
                    {entry.title || 'Untitled Reflection'}
                  </h4>
                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => onDeleteInteraction(entry.id, e)}
                    title="Delete reflection"
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition-opacity p-1 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className={`mt-1 text-xs line-clamp-2 leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {entry.preview || entry.summary || 'No dialogue yet...'}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span>{dateStr}</span>
                  </div>
                  <span>{entry.turns?.length || 0} turns</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Isolated Storage Footer Info */}
      <div className="p-3 border-t border-[#1e1e1e] bg-[#090909] text-[10px] uppercase tracking-wider font-mono text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
        <span>Firestore Isolated Subcollection</span>
      </div>
    </aside>
  );
};
