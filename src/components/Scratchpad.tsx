import React, { useState, useRef, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  ClipboardPaste, 
  Code2, 
  Type, 
  Sparkles,
  ArrowDownToLine,
  Braces
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
  // Monospace by default for developer-first experience
  const [isMono, setIsMono] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stats = getStats(value);

  // Check if content is valid JSON for quick format action
  const isJson = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }, [value]);

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

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      onNotify('JSON formatted with 2 spaces');
    } catch {
      onNotify('Invalid JSON syntax', 'error');
    }
  };

  // Smart developer keyboard navigation: Tab indentation & auto-indent on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Un-indent 2 spaces
        const before = value.substring(0, start);
        if (before.endsWith('  ')) {
          const newValue = value.substring(0, start - 2) + value.substring(start);
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          });
        }
      } else {
        // Insert 2 spaces indentation
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    } else if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const linesBefore = value.substring(0, start).split('\n');
      const currentLine = linesBefore[linesBefore.length - 1];
      const match = currentLine.match(/^(\s+)/);

      // Preserve indentation of the previous line
      if (match && match[1]) {
        e.preventDefault();
        const indent = match[1];
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-xl border border-zinc-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Scratchpad Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Scratchpad</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {stats.lines} {stats.lines === 1 ? 'line' : 'lines'} • {stats.words} words • {stats.chars} chars
          </span>
        </div>

        {/* View toggles & status */}
        <div className="flex items-center gap-2">
          {/* Format JSON button when JSON is detected */}
          {isJson && (
            <button
              onClick={handleFormatJson}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-indigo-400 text-[11px] font-mono border border-zinc-700/60 transition-colors cursor-pointer"
              title="Prettify JSON indentation"
            >
              <Braces className="w-3 h-3" />
              <span>Format JSON</span>
            </button>
          )}

          {isPublishing ? (
            <span className="text-[11px] text-emerald-400 font-mono animate-pulse mr-1">
              broadcasting...
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono mr-1 hidden sm:inline">
              synced
            </span>
          )}

          {/* Toggle Mono / Sans font */}
          <button
            onClick={() => setIsMono(!isMono)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
              isMono
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isMono ? 'Switch to Sans-serif font' : 'Switch to Monospace Code font'}
          >
            {isMono ? <Code2 className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{isMono ? 'Mono' : 'Sans'}</span>
          </button>
        </div>
      </div>

      {/* Main Code Editor Box */}
      <div className="relative flex-1 p-2 sm:p-3 flex flex-col min-h-0">
        <div className="relative flex-1 rounded-lg border border-zinc-800/80 bg-zinc-950/70 shadow-inner flex flex-col focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or paste code, links, JSON, logs, or notes here...&#10;&#10;• Supports Tab key for indentation (2 spaces)&#10;• Auto-preserves line indentation&#10;• Instant real-time sync with all your devices"
            className={`w-full flex-1 p-4 bg-transparent resize-none border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm leading-[1.7] whitespace-pre-wrap break-words min-h-[240px] lg:min-h-[400px] ${
              isMono 
                ? 'font-mono text-[13.5px] tracking-normal font-normal' 
                : 'font-sans text-sm tracking-normal'
            }`}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-800/80 bg-zinc-950/40 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 shadow-sm'
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
