import React, { useState } from 'react';
import { 
  X, 
  Dices, 
  History, 
  ArrowRight, 
  Hash, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { generateRoomSlug, sanitizeRoom, formatRelativeTime } from '../utils/format';
import { getRoomHistory } from '../utils/storage';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  onSelectRoom: (room: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSelectRoom,
  onNotify,
}) => {
  const [inputRoom, setInputRoom] = useState(currentRoom);
  const recentRooms = getRoomHistory();

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const sanitized = sanitizeRoom(inputRoom);
    if (!sanitized) {
      onNotify('Please enter a valid room name', 'error');
      return;
    }
    onSelectRoom(sanitized);
    onClose();
    onNotify(`Switched to #${sanitized}`);
  };

  const handleRandomize = () => {
    const slug = generateRoomSlug();
    setInputRoom(slug);
  };

  const handleSelectRecent = (room: string) => {
    onSelectRoom(room);
    onClose();
    onNotify(`Switched to #${room}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-4 sm:p-5 text-zinc-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Switch or Create Room</h3>
              <p className="text-[11px] text-zinc-400">Anyone with this room name can sync with you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Room Identifier
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                  #
                </span>
                <input
                  type="text"
                  value={inputRoom}
                  onChange={(e) => setInputRoom(e.target.value)}
                  placeholder="e.g. swift-falcon-42"
                  className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-base sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 font-mono"
                />
              </div>

              {/* Generate Random Button */}
              <button
                type="button"
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer shrink-0"
                title="Generate secure random room name"
              >
                <Dices className="w-3.5 h-3.5 text-indigo-400" />
                <span>Random</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-950/40 transition-colors cursor-pointer"
          >
            <span>Join / Create Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-2.5">
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <span>Recent Rooms on this Device</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {recentRooms.map((item) => {
                const isCurrent = item.name === currentRoom;
                return (
                  <div
                    key={item.name}
                    onClick={() => handleSelectRecent(item.name)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                      isCurrent
                        ? 'bg-zinc-950 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono">#</span>
                      <span className="font-mono font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{formatRelativeTime(item.lastVisited)}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
          <span>Zero-Auth: Use obscure room names for confidential temporary transfers.</span>
        </div>
      </div>
    </div>
  );
};
