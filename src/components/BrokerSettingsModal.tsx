import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Terminal
} from 'lucide-react';
import type { BrokerConfig, ConnectionStatus } from '../types/sync';
import { BROKERS, getRoomTopic } from '../config/brokers';

interface BrokerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBroker: BrokerConfig;
  connectionStatus: ConnectionStatus;
  currentRoom: string;
  senderId: string;
  onSelectBroker: (broker: BrokerConfig) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const BrokerSettingsModal: React.FC<BrokerSettingsModalProps> = ({
  isOpen,
  onClose,
  activeBroker,
  connectionStatus,
  currentRoom,
  senderId,
  onSelectBroker,
  onNotify,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (broker: BrokerConfig) => {
    onSelectBroker(broker);
    onNotify(`Switched to ${broker.name}`);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
      onNotify('Custom broker URL must start with wss:// or ws://', 'error');
      return;
    }

    const customBroker: BrokerConfig = {
      id: `custom_${Date.now()}`,
      name: 'Custom Broker',
      url,
      isCustom: true,
    };

    onSelectBroker(customBroker);
    setIsAddingCustom(false);
    setCustomUrl('');
    onNotify('Switched to custom broker');
  };

  const topic = getRoomTopic(currentRoom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-4 sm:p-5 text-zinc-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">MQTT Broker & Diagnostics</h3>
              <p className="text-[11px] text-zinc-400">Zero-Backend WebSocket Transport</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Broker Selection List */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-medium text-zinc-400">
            Active Broker (Automatic Fallback Enabled)
          </label>

          {BROKERS.map((broker) => {
            const isSelected = activeBroker.id === broker.id;
            return (
              <div
                key={broker.id}
                onClick={() => handleSelect(broker)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-950 border-emerald-500/50 shadow-sm'
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">
                      {broker.name}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-950 border border-emerald-800 text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    {broker.url}
                  </p>
                </div>

                <div className="w-5 h-5 rounded-full border flex items-center justify-center ml-2 shrink-0 border-zinc-700">
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
                </div>
              </div>
            );
          })}

          {/* Custom Broker Option */}
          {activeBroker.isCustom && (
            <div className="p-3 rounded-xl border bg-zinc-950 border-emerald-500/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Custom Broker</span>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5 truncate max-w-[280px]">
                  {activeBroker.url}
                </p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          )}

          {!isAddingCustom ? (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-1 cursor-pointer transition-colors"
            >
              + Use custom WebSocket broker
            </button>
          ) : (
            <form onSubmit={handleAddCustom} className="mt-2 space-y-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="wss://your-broker-domain:8084/mqtt"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-base sm:text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Diagnostics Box */}
        <div className="mt-5 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 pb-1.5 border-b border-zinc-800/60">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connection Diagnostics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-500 block">Status:</span>
              <span className="font-mono text-zinc-200 capitalize">{connectionStatus}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">QoS & Retain:</span>
              <span className="font-mono text-emerald-400">QoS 1 • Retain: true</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 block">Active Topic:</span>
              <span className="font-mono text-zinc-300 text-[10px] break-all select-all">
                {topic}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 block">Tab Sender ID (In-Memory):</span>
              <span className="font-mono text-zinc-400 text-[10px] truncate block select-all">
                {senderId}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
