import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Layers, 
  Trash2, 
  FileText 
} from 'lucide-react';
import type { NoteCard } from '../types/sync';
import { CardItem } from './CardItem';

interface CardListProps {
  cards: NoteCard[];
  onAddCard: (content: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onClearAll: () => void;
  onSendToScratchpad: (content: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  onAddCard,
  onTogglePin,
  onDeleteCard,
  onClearAll,
  onSendToScratchpad,
  onNotify,
}) => {
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('all');

  const handleAdd = () => {
    if (!newContent.trim()) return;
    onAddCard(newContent);
    setNewContent('');
    onNotify('Card added');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Filter by tab
    if (activeTab === 'pinned') {
      result = result.filter((c) => c.pinned);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.content.toLowerCase().includes(q));
    }

    // Sort: pinned first, then newest first
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [cards, activeTab, searchQuery]);

  const pinnedCount = useMemo(() => cards.filter((c) => c.pinned).length, [cards]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-xl border border-zinc-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Header & Quick Input */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Cards & Snippets</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {/* Input box */}
        <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/80 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all p-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick note, link, snippet, or API key... (Cmd + Enter to post)"
            rows={2}
            className="w-full bg-transparent resize-none border-none outline-none text-zinc-100 placeholder-zinc-600 text-xs sm:text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between pt-1.5 border-t border-zinc-900 text-xs">
            <span className="text-[10px] text-zinc-500 hidden sm:inline">
              Press <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[9px]">⌘ + Enter</kbd> to add
            </span>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between gap-2 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({cards.length})
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'pinned'
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Pinned ({pinnedCount})</span>
          </button>
        </div>

        {/* Search Input & Clear */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-6 pr-2 py-0.8 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 w-24 sm:w-32 focus:w-40 transition-all"
            />
          </div>

          {cards.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Delete all note cards in this room?')) {
                  onClearAll();
                  onNotify('All cards cleared');
                }
              }}
              className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Delete all cards"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[220px]">
        {filteredCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <FileText className="w-8 h-8 text-zinc-700 mb-2 stroke-1" />
            <p className="text-xs font-medium text-zinc-400">
              {searchQuery
                ? 'No cards match your search'
                : activeTab === 'pinned'
                ? 'No pinned cards in this room'
                : 'No cards yet'}
            </p>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">
              {searchQuery
                ? 'Try a different search keyword'
                : 'Save snippets, tokens, or links above to access them anywhere.'}
            </p>
          </div>
        ) : (
          filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onTogglePin={onTogglePin}
              onDelete={onDeleteCard}
              onSendToScratchpad={onSendToScratchpad}
              onNotify={onNotify}
            />
          ))
        )}
      </div>
    </div>
  );
};
