import React from 'react';
import { 
  Pin, 
  Trash2, 
  Copy, 
  Check, 
  ArrowUpToLine 
} from 'lucide-react';
import type { NoteCard } from '../types/sync';
import { formatRelativeTime } from '../utils/format';
import { useClipboard } from '../hooks/useClipboard';

interface CardItemProps {
  card: NoteCard;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onSendToScratchpad: (content: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  onTogglePin,
  onDelete,
  onSendToScratchpad,
  onNotify,
}) => {
  const { copied, copy } = useClipboard();

  const handleCopy = async () => {
    const ok = await copy(card.content);
    if (ok) {
      onNotify('Note copied to clipboard');
    }
  };

  const handleSendToScratchpad = () => {
    onSendToScratchpad(card.content);
    onNotify('Appended to scratchpad');
  };

  // Simple heuristic for code or multi-line snippet detection
  const isLikelyCode =
    card.content.includes('\n') &&
    (card.content.includes('{') ||
      card.content.includes(';') ||
      card.content.includes('const ') ||
      card.content.includes('function ') ||
      card.content.includes('import '));

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 p-3 sm:p-3.5 flex flex-col justify-between ${
        card.pinned
          ? 'bg-zinc-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/80'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-zinc-500" title={new Date(card.createdAt).toLocaleString()}>
            {formatRelativeTime(card.createdAt)}
          </span>
          {card.pinned && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
              <Pin className="w-2.5 h-2.5 fill-emerald-400" />
              Pinned
            </span>
          )}
        </div>

        {/* Action icons - always visible on mobile, reveal on hover on desktop */}
        <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(card.id)}
            className={`p-1.5 sm:p-1 rounded-md text-xs transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center ${
              card.pinned
                ? 'text-emerald-400 hover:bg-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={card.pinned ? 'Unpin card' : 'Pin card to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${card.pinned ? 'fill-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 sm:p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Copy content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onDelete(card.id)}
            className="p-1.5 sm:p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div
        className={`text-xs sm:text-sm text-zinc-200 break-words whitespace-pre-wrap leading-relaxed select-text mb-3 ${
          isLikelyCode
            ? 'font-mono text-[12px] bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/70 overflow-x-auto text-zinc-300'
            : ''
        }`}
      >
        {card.content}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <button
          onClick={handleSendToScratchpad}
          className="flex items-center gap-1 hover:text-zinc-300 py-1 transition-colors cursor-pointer"
          title="Append to scratchpad"
        >
          <ArrowUpToLine className="w-3 h-3 text-indigo-400" />
          <span>Insert in Scratchpad</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-300 py-1 transition-colors cursor-pointer"
        >
          {copied ? (
            <span className="text-emerald-400 font-medium">Copied!</span>
          ) : (
            <span>Copy text</span>
          )}
        </button>
      </div>
    </div>
  );
};
