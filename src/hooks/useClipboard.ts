import { useState, useCallback } from 'react';

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for non-https or older contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
      }
    },
    [timeout]
  );

  const paste = useCallback(async (): Promise<string | null> => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
      return null;
    } catch (err) {
      console.warn('Clipboard read permission denied or unsupported:', err);
      return null;
    }
  }, []);

  return { copied, copy, paste };
}
