import React, { useState, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  ClipboardPaste, 
  Code2, 
  Type, 
  Sparkles,
  ArrowDownToLine
} from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';
import { getStats } from '../utils/format';

interface ScratchpadProps {
  value: string;
  onChange: (newValue: string) => void;
  onSaveAsCard: (content: string) => void;
  onClear: () => void;
  isPublishing: boolean;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({
  value,
  onChange,
  onSaveAsCard,
  onClear,
  isPublishing,
  onNotify,
}) => {
  const { copied, copy, paste } = useClipboard();
  const [isMono, setIsMono] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stats = getStats(value);

  const handleCopy = async () => {
    if (!value.trim()) {
      onNotify('Scratchpad is empty', 'info');
      return;
    }
    const success = await copy(value);
    if (success) {
      onNotify('Copied scratchpad to clipboard!');
    }
  };

  const handlePaste = async () => {
    const text = await paste();
    if (text) {
      onChange(value ? `${value}\n${text}` : text);
      onNotify('Pasted from clipboard');
    } else {
      // Focus textarea so user can press Ctrl+V directly if permission denied
      textareaRef.current?.focus();
      onNotify('Clipboard permission unavailable. Press Ctrl+V directly.', 'info');
    }
  };

  const handleSaveToCard = () => {
    if (!value.trim()) {
      onNotify('Write or paste something first to save as a card', 'info');
      return;
    }
    onSaveAsCard(value);
    onNotify('Saved to cards list');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-xl border border-zinc-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Scratchpad Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Scratchpad</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {stats.chars} chars • {stats.words} words
          </span>
        </div>

        {/* View toggles & status */}
        <div className="flex items-center gap-1.5">
          {isPublishing ? (
            <span className="text-[11px] text-emerald-400 font-mono animate-pulse mr-1">
              broadcasting...
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono mr-1 hidden sm:inline">
              synced
            </span>
          )}

          <button
            onClick={() => setIsMono(!isMono)}
            className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
              isMono
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isMono ? 'Switch to Sans font' : 'Switch to Monospace font'}
          >
            {isMono ? <Code2 className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 p-2 sm:p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste anything here... Instant live sync across devices without login."
          className={`w-full h-full min-h-[220px] lg:min-h-[380px] p-3 bg-transparent resize-none border-none outline-none text-zinc-100 placeholder-zinc-600 text-sm leading-relaxed ${
            isMono ? 'font-mono text-[13px]' : 'font-sans'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-800/80 bg-zinc-950/40 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Paste Button */}
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            title="Paste from system clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Paste</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save to Note Card */}
          <button
            onClick={handleSaveToCard}
            disabled={!value.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
            title="Convert current scratchpad text into a permanent card"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save as Card</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={() => {
              if (value && window.confirm('Clear the entire scratchpad?')) {
                onClear();
                onNotify('Scratchpad cleared');
              }
            }}
            disabled={!value}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Clear scratchpad"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
