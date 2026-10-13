import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Scratchpad } from './components/Scratchpad';
import { CardList } from './components/CardList';
import { QrCodeModal } from './components/QrCodeModal';
import { RoomModal } from './components/RoomModal';
import { BrokerSettingsModal } from './components/BrokerSettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { useMqttSync } from './hooks/useMqttSync';
import { 
  sanitizeRoom, 
  generateRoomSlug 
} from './utils/format';
import { 
  getStoredLastRoom, 
  setStoredLastRoom, 
  addRoomToHistory 
} from './utils/storage';

export default function App() {
  // Determine initial room from URL (search param ?room=... or hash #/...) or storage or generated
  const [room, setRoom] = useState<string>(() => {
    if (typeof window === 'undefined') return 'main';

    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get('room');
    if (roomParam) return sanitizeRoom(roomParam);

    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash) return sanitizeRoom(hash);

    const stored = getStoredLastRoom();
    if (stored) return sanitizeRoom(stored);

    return generateRoomSlug();
  });

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Mobile navigation tab ('scratchpad' | 'cards')
  const [mobileTab, setMobileTab] = useState<'scratchpad' | 'cards'>('scratchpad');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type?: 'success' | 'info' | 'error') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync URL and storage with current room
  useEffect(() => {
    setStoredLastRoom(room);
    addRoomToHistory(room);

    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    window.history.replaceState(null, '', url.toString());
  }, [room]);

  const handleRemoteUpdate = useCallback(() => {
    addToast('Remote update synced', 'info');
  }, [addToast]);

  const handleErrorToast = useCallback((msg: string) => {
    addToast(msg, 'error');
  }, [addToast]);

  // Hook up MQTT Sync engine
  const {
    scratchpad,
    cards,
    connectionStatus,
    activeBroker,
    isPublishing,
    senderId,
    updateScratchpad,
    addCard,
    togglePinCard,
    deleteCard,
    clearAllCards,
    clearScratchpad,
    switchBroker,
  } = useMqttSync({
    room,
    onRemoteUpdate: handleRemoteUpdate,
    onErrorToast: handleErrorToast,
  });

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K => Room switcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsRoomModalOpen((prev) => !prev);
      }
      // Cmd/Ctrl + Shift + C => Copy scratchpad
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (scratchpad) {
          navigator.clipboard.writeText(scratchpad).then(() => {
            addToast('Scratchpad copied to clipboard');
          });
        }
      }
      // Esc => Close all modals
      if (e.key === 'Escape') {
        setIsRoomModalOpen(false);
        setIsQrModalOpen(false);
        setIsBrokerModalOpen(false);
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scratchpad, addToast]);

  const handleAppendToScratchpad = (text: string) => {
    if (!scratchpad.trim()) {
      updateScratchpad(text);
    } else {
      updateScratchpad(`${scratchpad}\n\n${text}`);
    }
    // Switch to scratchpad view on mobile so user immediately sees inserted text
    setMobileTab('scratchpad');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Header */}
      <Navbar
        room={room}
        connectionStatus={connectionStatus}
        activeBroker={activeBroker}
        isPublishing={isPublishing}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onNotify={addToast}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-5 flex flex-col">
        {/* Mobile Segmented View Switcher (Visible on mobile < lg, hidden on desktop lg+) */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800/80 mb-3 text-xs font-medium">
          <button
            onClick={() => setMobileTab('scratchpad')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              mobileTab === 'scratchpad'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scratchpad</span>
          </button>
          <button
            onClick={() => setMobileTab('cards')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              mobileTab === 'cards'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Cards ({cards.length})</span>
          </button>
        </div>

        {/* Workspace Grid / Panels */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch min-h-0">
          {/* Scratchpad Column: visible on desktop, or when mobileTab === 'scratchpad' */}
          <section
            className={`${
              mobileTab === 'scratchpad' ? 'flex' : 'hidden'
            } lg:flex lg:col-span-7 flex-col h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[560px]`}
          >
            <Scratchpad
              value={scratchpad}
              onChange={updateScratchpad}
              onSaveAsCard={(content) => addCard(content)}
              onClear={clearScratchpad}
              isPublishing={isPublishing}
              onNotify={addToast}
            />
          </section>

          {/* Cards Column: visible on desktop, or when mobileTab === 'cards' */}
          <section
            className={`${
              mobileTab === 'cards' ? 'flex' : 'hidden'
            } lg:flex lg:col-span-5 flex-col h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[560px]`}
          >
            <CardList
              cards={cards}
              onAddCard={addCard}
              onTogglePin={togglePinCard}
              onDeleteCard={deleteCard}
              onClearAll={clearAllCards}
              onSendToScratchpad={handleAppendToScratchpad}
              onNotify={addToast}
            />
          </section>
        </div>
      </main>

      {/* Subtle Footer with safe area padding */}
      <footer className="border-t border-zinc-800/60 py-3 px-4 sm:px-6 bg-zinc-950/60 text-center pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <p className="text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-400">ClipSync</span> • Zero-auth, static-first cross-device clipboard sync via MQTT (Retain + QoS 1).
          <span className="hidden sm:inline"> Instant & private across devices.</span>
        </p>
      </footer>

      {/* Modals */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        room={room}
        onNotify={addToast}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        currentRoom={room}
        onSelectRoom={setRoom}
        onNotify={addToast}
      />

      <BrokerSettingsModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        activeBroker={activeBroker}
        connectionStatus={connectionStatus}
        currentRoom={room}
        senderId={senderId}
        onSelectBroker={switchBroker}
        onNotify={addToast}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
