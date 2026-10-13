import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import type { SyncPayload, NoteCard, ConnectionStatus, BrokerConfig } from '../types/sync';
import { BROKERS, DEFAULT_BROKER, FALLBACK_BROKER, getRoomTopic } from '../config/brokers';
import { getCachedRoomState, setCachedRoomState, setStoredBroker, getStoredBroker } from '../utils/storage';

// In-memory unique senderId generated once per browser tab
const TAB_SENDER_ID: string =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

interface UseMqttSyncOptions {
  room: string;
  initialBroker?: BrokerConfig;
  onRemoteUpdate?: (payload: SyncPayload) => void;
  onErrorToast?: (message: string) => void;
}

export function useMqttSync({
  room,
  initialBroker,
  onRemoteUpdate,
  onErrorToast,
}: UseMqttSyncOptions) {
  // Determine active broker from storage, props, or default
  const [activeBroker, setActiveBroker] = useState<BrokerConfig>(() => {
    const savedUrl = getStoredBroker();
    if (savedUrl) {
      const found = BROKERS.find((b) => b.url === savedUrl);
      if (found) return found;
      return { id: 'custom', name: 'Custom Broker', url: savedUrl, isCustom: true };
    }
    return initialBroker || DEFAULT_BROKER;
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastRemoteSender, setLastRemoteSender] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Core synchronized state
  const [scratchpad, setScratchpad] = useState<string>(() => {
    const cached = getCachedRoomState(room);
    return cached?.scratchpad ?? '';
  });

  const [cards, setCards] = useState<NoteCard[]>(() => {
    const cached = getCachedRoomState(room);
    return cached?.cards ?? [];
  });

  // Tracking refs to avoid stale closures in MQTT message handlers
  const clientRef = useRef<MqttClient | null>(null);
  const currentTopicRef = useRef<string>(getRoomTopic(room));
  const activeBrokerRef = useRef<BrokerConfig>(activeBroker);
  const lastLocalTimestampRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  const hasFallbackTriggeredRef = useRef<boolean>(false);
  const scratchpadRef = useRef<string>(scratchpad);
  const cardsRef = useRef<NoteCard[]>(cards);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs so changes to callbacks never cause re-connections
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const onErrorToastRef = useRef(onErrorToast);

  useEffect(() => {
    onRemoteUpdateRef.current = onRemoteUpdate;
  }, [onRemoteUpdate]);

  useEffect(() => {
    onErrorToastRef.current = onErrorToast;
  }, [onErrorToast]);

  // Synchronize refs safely in effects
  useEffect(() => {
    scratchpadRef.current = scratchpad;
  }, [scratchpad]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    activeBrokerRef.current = activeBroker;
  }, [activeBroker]);

  useEffect(() => {
    currentTopicRef.current = getRoomTopic(room);
    const cached = getCachedRoomState(room);
    queueMicrotask(() => {
      setScratchpad(cached?.scratchpad ?? '');
      setCards(cached?.cards ?? []);
    });
    lastLocalTimestampRef.current = cached?.updatedAt ?? 0;
  }, [room]);

  // Publish function with retain: true and qos: 1
  const publishPayload = useCallback(
    (newScratchpad: string, newCards: NoteCard[], immediateTimestamp?: number) => {
      const client = clientRef.current;
      const topic = currentTopicRef.current;
      const now = immediateTimestamp ?? Date.now();

      lastLocalTimestampRef.current = now;

      const payload: SyncPayload = {
        scratchpad: newScratchpad,
        cards: newCards,
        updatedAt: now,
        senderId: TAB_SENDER_ID,
      };

      // Optimistically cache locally
      setCachedRoomState(room, payload);
      setLastSyncedAt(now);

      if (!client || !client.connected) {
        return;
      }

      setIsPublishing(true);
      const jsonString = JSON.stringify(payload);

      client.publish(topic, jsonString, { qos: 1, retain: true }, (err) => {
        setIsPublishing(false);
        if (err) {
          console.error('[ClipSync] Publish error:', err);
        }
      });
    },
    [room]
  );

  // Debounced publish specifically for scratchpad keystrokes
  const updateScratchpad = useCallback(
    (newContent: string) => {
      setScratchpad(newContent);
      scratchpadRef.current = newContent;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        publishPayload(newContent, cardsRef.current);
      }, 350);
    },
    [publishPayload]
  );

  // Immediate operations for cards (No debounce)
  const addCard = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const newCard: NoteCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        content: trimmed,
        createdAt: Date.now(),
        pinned: false,
      };

      const updatedCards = [newCard, ...cardsRef.current];
      setCards(updatedCards);
      cardsRef.current = updatedCards;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      publishPayload(scratchpadRef.current, updatedCards);
    },
    [publishPayload]
  );

  const togglePinCard = useCallback(
    (cardId: string) => {
      const updatedCards = cardsRef.current.map((c) =>
        c.id === cardId ? { ...c, pinned: !c.pinned } : c
      );
      setCards(updatedCards);
      cardsRef.current = updatedCards;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      publishPayload(scratchpadRef.current, updatedCards);
    },
    [publishPayload]
  );

  const deleteCard = useCallback(
    (cardId: string) => {
      const updatedCards = cardsRef.current.filter((c) => c.id !== cardId);
      setCards(updatedCards);
      cardsRef.current = updatedCards;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      publishPayload(scratchpadRef.current, updatedCards);
    },
    [publishPayload]
  );

  const clearAllCards = useCallback(() => {
    setCards([]);
    cardsRef.current = [];

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    publishPayload(scratchpadRef.current, []);
  }, [publishPayload]);

  const clearScratchpad = useCallback(() => {
    setScratchpad('');
    scratchpadRef.current = '';

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    publishPayload('', cardsRef.current);
  }, [publishPayload]);

  const clearAllRoomData = useCallback(() => {
    setScratchpad('');
    scratchpadRef.current = '';
    setCards([]);
    cardsRef.current = [];

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    publishPayload('', []);
  }, [publishPayload]);

  // Connect to MQTT Broker
  useEffect(() => {
    let isCancelled = false;
    const topic = getRoomTopic(room);
    currentTopicRef.current = topic;
    consecutiveErrorsRef.current = 0;
    hasFallbackTriggeredRef.current = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setConnectionStatus('connecting');
      }
    });

    const clientId = `clipsync_${Math.random().toString(16).substring(2, 10)}_${Date.now().toString(36)}`;

    const client = mqtt.connect(activeBroker.url, {
      clientId,
      clean: true,
      keepalive: 60,
      reconnectPeriod: 4000,
      connectTimeout: 9000,
      protocolVersion: 4,
    });

    clientRef.current = client;

    client.on('connect', () => {
      if (isCancelled) return;
      setConnectionStatus('connected');
      consecutiveErrorsRef.current = 0;

      // Subscribe with QoS 1 to receive retained state immediately
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (isCancelled) return;
        if (err) {
          const msg = err.message || '';
          // Ignore connection closed error during teardown or rapid reload
          if (msg.includes('Connection closed') || msg.includes('client is closed')) {
            return;
          }
          console.error('[ClipSync] Subscription error:', err);
          setConnectionStatus('error');
        }
      });
    });

    client.on('reconnect', () => {
      if (isCancelled) return;
      setConnectionStatus('reconnecting');
    });

    client.on('close', () => {
      if (isCancelled) return;
      setConnectionStatus('disconnected');
    });

    client.on('offline', () => {
      if (isCancelled) return;
      setConnectionStatus('disconnected');
    });

    client.on('error', (err) => {
      if (isCancelled) return;
      console.warn('[ClipSync] Connection error on broker', activeBroker.name, err);
      consecutiveErrorsRef.current += 1;
      setConnectionStatus('error');

      // Auto-fallback mechanism: If EMQX fails repeatedly, switch to HiveMQ
      if (
        activeBroker.id === DEFAULT_BROKER.id &&
        consecutiveErrorsRef.current >= 2 &&
        !hasFallbackTriggeredRef.current
      ) {
        hasFallbackTriggeredRef.current = true;
        onErrorToastRef.current?.('Primary broker unavailable. Auto-switching to HiveMQ fallback.');
        setActiveBroker(FALLBACK_BROKER);
        setStoredBroker(FALLBACK_BROKER.url);
      }
    });

    client.on('message', (receivedTopic, messageBuffer) => {
      if (isCancelled || receivedTopic !== topic) return;

      try {
        const payloadText = messageBuffer.toString('utf-8');
        if (!payloadText.trim()) return;

        const incoming: SyncPayload = JSON.parse(payloadText);

        // Echo prevention: Ignore messages published by this exact browser tab
        if (incoming.senderId === TAB_SENDER_ID) {
          return;
        }

        // Conflict handling: Only apply if newer than or equal to local baseline
        if (incoming.updatedAt >= lastLocalTimestampRef.current) {
          lastLocalTimestampRef.current = incoming.updatedAt;
          setScratchpad(incoming.scratchpad ?? '');
          scratchpadRef.current = incoming.scratchpad ?? '';
          setCards(incoming.cards ?? []);
          cardsRef.current = incoming.cards ?? [];
          setLastSyncedAt(incoming.updatedAt);
          setLastRemoteSender(incoming.senderId.slice(0, 8));

          // Save to local cache
          setCachedRoomState(room, incoming);

          onRemoteUpdateRef.current?.(incoming);
        }
      } catch (err) {
        console.error('[ClipSync] Failed to parse incoming sync payload:', err);
      }
    });

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      try {
        client.removeAllListeners();
        client.end(true);
      } catch (e) {
        console.warn('Error ending client:', e);
      }
    };
  }, [room, activeBroker.url, activeBroker.id, activeBroker.name]);

  const switchBroker = useCallback((newBroker: BrokerConfig) => {
    setActiveBroker(newBroker);
    setStoredBroker(newBroker.url);
  }, []);

  return {
    // State
    scratchpad,
    cards,
    connectionStatus,
    activeBroker,
    lastSyncedAt,
    lastRemoteSender,
    isPublishing,
    senderId: TAB_SENDER_ID,

    // Actions
    updateScratchpad,
    addCard,
    togglePinCard,
    deleteCard,
    clearAllCards,
    clearScratchpad,
    clearAllRoomData,
    switchBroker,
  };
}
