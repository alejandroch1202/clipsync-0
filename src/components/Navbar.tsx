import React, { useState } from 'react';
import { 
  Zap, 
  QrCode, 
  Command, 
  Copy, 
  Check, 
  ChevronDown
} from 'lucide-react';
import type { ConnectionStatus, BrokerConfig } from '../types/sync';

interface NavbarProps {
  room: string;
  connectionStatus: ConnectionStatus;
  activeBroker: BrokerConfig;
  isPublishing: boolean;
  onOpenRoomModal: () => void;
  onOpenQrModal: () => void;
  onOpenBrokerModal: () => void;
  onOpenShortcutsModal: () => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  connectionStatus,
  activeBroker,
  isPublishing,
  onOpenRoomModal,
  onOpenQrModal,
  onOpenBrokerModal,
  onOpenShortcutsModal,
  onNotify,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      onNotify('Room link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onNotify('Failed to copy room link', 'error');
    }
  };

  const statusConfig = {
    connected: {
      color: 'bg-emerald-500',
      text: 'Connected',
      textColor: 'text-emerald-400',
    },
    connecting: {
      color: 'bg-amber-500 animate-pulse',
      text: 'Connecting...',
      textColor: 'text-amber-400',
    },
    reconnecting: {
      color: 'bg-amber-500 animate-pulse',
      text: 'Reconnecting...',
      textColor: 'text-amber-400',
    },
    disconnected: {
      color: 'bg-zinc-500',
      text: 'Offline',
      textColor: 'text-zinc-400',
    },
    error: {
      color: 'bg-red-500',
      text: 'Error',
      textColor: 'text-red-400',
    },
  }[connectionStatus];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={onOpenRoomModal}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/50 transition-colors">
              <Zap className="w-4 h-4 fill-emerald-400/20" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
              ClipSync
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                MQTT
              </span>
            </span>
          </div>

          <div className="hidden sm:block h-4 w-[1px] bg-zinc-800" />

          {/* Room Pill Selector */}
          <div 
            onClick={onOpenRoomModal}
            className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/70 cursor-pointer transition-all text-xs group"
            title="Click to change or generate new room"
          >
            <span className="text-zinc-500 group-hover:text-zinc-400">#</span>
            <span className="font-mono text-zinc-200 font-medium max-w-[140px] truncate sm:max-w-none">
              {room}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />

            {/* Quick copy link icon */}
            <button
              onClick={handleCopyLink}
              className="ml-1 p-1 rounded-full hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Copy room link"
            >
              {copiedLink ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Connection & Broker Status Pill */}
          <button
            onClick={onOpenBrokerModal}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
            title="Click to view broker diagnostics or switch server"
          >
            <span className="relative flex h-2 w-2">
              {connectionStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color}`} />
            </span>
            <span className="hidden md:inline font-mono text-[11px] text-zinc-400">
              {activeBroker.name.split(' ')[0]}
            </span>
            {isPublishing ? (
              <span className="text-[11px] text-emerald-400 animate-pulse font-medium">Syncing...</span>
            ) : (
              <span className={`text-[11px] font-medium ${statusConfig.textColor}`}>
                {statusConfig.text}
              </span>
            )}
          </button>

          {/* QR Code Action Button */}
          <button
            onClick={onOpenQrModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer"
            title="Share with Phone (QR Code)"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Mobile QR</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcutsModal}
            className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Keyboard shortcuts (Cmd+K)"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
