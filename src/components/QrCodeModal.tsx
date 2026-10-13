import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Smartphone } from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: string;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { copied, copy } = useClipboard();

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#ffffff',
        light: '#09090b', // zinc-950
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copy(currentUrl);
    if (ok) {
      onNotify('Room link copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 text-zinc-100 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Sync with Mobile</h3>
              <p className="text-[11px] text-zinc-400">Zero-auth peer clipboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Room QR Code"
                className="w-48 h-48 rounded-lg select-none"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-zinc-500 text-xs">
                Generating QR...
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-zinc-400 max-w-[240px]">
            Scan with your phone's camera to immediately open and sync this room.
          </p>
        </div>

        {/* Room Info & Copy Button */}
        <div className="space-y-2">
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-zinc-300 truncate">
              {currentUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
