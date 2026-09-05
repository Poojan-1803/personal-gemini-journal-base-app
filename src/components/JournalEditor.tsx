import React, { useState, useRef, useEffect } from 'react';
import { JournalInteraction, ChatMessage } from '../types';
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface JournalEditorProps {
  interaction: JournalInteraction;
  onSave: (updated: JournalInteraction) => Promise<void>;
  isSaving: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  interaction,
  onSave,
  isSaving,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [title, setTitle] = useState(interaction.title);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(interaction.title);
    setErrorMsg(null);
  }, [interaction.id, interaction.title]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction.turns, isGenerating]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const updated: JournalInteraction = {
      ...interaction,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated).catch((err) => {
      setErrorMsg('Failed to update title in Firestore: ' + err.message);
    });
  };

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isGenerating) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newTurns = [...interaction.turns, userMessage];

    // Optimistically update preview & save initial user turn
    const updatedWithUser: JournalInteraction = {
      ...interaction,
      title: interaction.title === 'New Reflection' ? trimmed.slice(0, 30) + '...' : interaction.title,
      preview: trimmed.slice(0, 120),
      turns: newTurns,
      updatedAt: new Date().toISOString(),
    };

    setInputText('');
    setIsGenerating(true);

    try {
      // 1. Guaranteed save of user message to Firestore
      await onSave(updatedWithUser);

      // 2. Call backend Gemini API endpoint with fallback ladder
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: newTurns,
          prompt: trimmed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const responseData = await res.json();
      const modelMessage: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        role: 'model',
        content: responseData.text,
        timestamp: new Date().toISOString(),
      };

      const finalTurns = [...newTurns, modelMessage];
      const finalInteraction: JournalInteraction = {
        ...updatedWithUser,
        turns: finalTurns,
        updatedAt: new Date().toISOString(),
      };

      // 3. Guaranteed save of model output to Firestore
      await onSave(finalInteraction);
    } catch (err: any) {
      console.error('Error in reflective conversation:', err);
      setErrorMsg(err.message || 'Failed to get reflection from Gemini.');
      // Keep user input preserved in state if it failed completely before user message save
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (interaction.turns.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns: interaction.turns }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const updated: JournalInteraction = {
        ...interaction,
        title: data.title || interaction.title,
        summary: data.summary || '',
        updatedAt: new Date().toISOString(),
      };

      setTitle(data.title || interaction.title);
      await onSave(updated);
      setSuccessMsg('Summary and title generated and saved to Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Failed to summarize: ' + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div id="journal-editor-root" className="flex-1 flex flex-col h-full bg-[#050505] text-[#d1d1d1] overflow-hidden selection:bg-[#f27d26]/30">
      {/* Top Banner / Title Bar */}
      <div className="p-4 sm:px-8 border-b border-[#1e1e1e] bg-[#0c0c0c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
        <div className="flex-1 min-w-0">
          <input
            id="reflection-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => handleTitleChange(e.target.value)}
            placeholder="Name your reflection..."
            className="w-full text-xl sm:text-2xl font-serif italic text-white bg-transparent border-b border-transparent hover:border-[#1e1e1e] focus:border-[#f27d26] focus:outline-none px-1 py-0.5 tracking-tight font-medium placeholder:text-gray-700"
          />
          <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider text-gray-500 font-mono">
            <span>Created: {new Date(interaction.createdAt).toLocaleString()}</span>
            {isSaving && <span className="text-[#f27d26] animate-pulse font-semibold">Syncing to Firestore...</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="auto-summarize-button"
            onClick={handleGenerateSummary}
            disabled={isSummarizing || interaction.turns.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-300 bg-[#141414] hover:bg-[#1c1c1c] hover:text-[#f27d26] border border-[#222222] rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title="Auto-generate title and reflective summary using Gemini"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#f27d26] ${isSummarizing ? 'animate-spin' : ''}`} />
            <span>{isSummarizing ? 'Synthesizing...' : 'AI Summary'}</span>
          </button>
        </div>
      </div>

      {/* Notifications & Error Banners */}
      {errorMsg && (
        <div id="editor-error-banner" className="mx-6 mt-4 p-3 bg-[#1c1209] border border-[#f27d26]/40 text-[#f27d26] rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#f27d26] shrink-0" />
            <span className="text-gray-300">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="underline cursor-pointer text-[#f27d26] uppercase text-[10px] tracking-wider font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div id="editor-success-banner" className="mx-6 mt-4 p-3 bg-[#0a1811] border border-emerald-500/40 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Box if present */}
      {interaction.summary && (
        <div id="reflection-summary-box" className="mx-6 sm:mx-8 mt-4 p-5 rounded-2xl bg-[#0e0e0e] border-l-2 border-l-[#f27d26] border-t border-t-[#1e1e1e] border-r border-r-[#1e1e1e] border-b border-b-[#1e1e1e] text-gray-200 text-xs sm:text-sm shadow-md">
          <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-[0.2em] text-[#f27d26] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reflection Synthesis</span>
          </div>
          <p className="text-gray-300 leading-relaxed font-serif italic text-sm sm:text-base">{interaction.summary}</p>
        </div>
      )}

      {/* Dialogue Area */}
      <div id="conversation-dialogue-area" className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#050505]">
        {interaction.turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#0c0c0c] border border-[#1e1e1e] text-[#f27d26] flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(242,125,38,0.12)]">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-serif italic text-xl text-white">Start Your Reflection</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
              Write a thought, a personal experience, a goal, or a challenge. Gemini 3.6 Flash will respond with thoughtful observations and multi-turn reflections.
            </p>
          </div>
        ) : (
          interaction.turns.map((turn) => {
            const isUser = turn.role === 'user';
            return (
              <div
                key={turn.id}
                id={`message-${turn.id}`}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#f27d26] border border-[#222222] flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#141414] border border-[#222222] text-gray-200 rounded-tr-none'
                      : 'bg-[#0e0e0e] border-l-2 border-l-[#f27d26] border-t border-t-[#1e1e1e] border-r border-r-[#1e1e1e] border-b border-b-[#1e1e1e] text-white font-serif italic rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isUser ? 'text-gray-400 font-sans' : 'text-[#f27d26] not-italic font-sans'}`}>
                      {isUser ? 'You' : 'Gemini'}
                    </span>
                    <span className="text-[10px] font-mono not-italic text-gray-500">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap not-italic font-sans text-gray-200">{turn.content}</p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a] flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex gap-3 max-w-3xl mr-auto justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#f27d26] border border-[#222222] flex items-center justify-center shrink-0 mt-1 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-[#0e0e0e] border-l-2 border-l-[#f27d26] border border-[#1e1e1e] text-gray-400 rounded-tl-none text-xs flex items-center gap-2.5 shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f27d26]" />
              <span>Gemini is reflecting on your entry...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 sm:p-6 bg-[#0c0c0c] border-t border-[#1e1e1e]">
        <form
          id="journal-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex gap-3 items-end"
        >
          <div className="flex-1 relative">
            <textarea
              id="journal-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="What's on your mind? Share a reflection, question, or experience... (Shift+Enter for newline)"
              rows={2}
              className="w-full resize-none rounded-xl border border-[#1e1e1e] p-3.5 pr-10 text-sm text-white focus:border-[#f27d26] focus:ring-1 focus:ring-[#f27d26] focus:outline-none placeholder:text-gray-600 bg-[#050505]"
            />
          </div>

          <button
            id="send-reflection-button"
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="h-11 px-5 rounded-xl bg-white text-black hover:bg-[#f27d26] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-gray-600 font-mono">
          Powered by Gemini 3.6 Flash &bull; Stored in Cloud Firestore
        </div>
      </div>
    </div>
  );
};
