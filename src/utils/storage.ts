import type { SyncPayload, RoomHistoryItem } from '../types/sync';

const ROOM_HISTORY_KEY = 'clipsync_room_history';
const LAST_ROOM_KEY = 'clipsync_last_room';
const BROKER_KEY = 'clipsync_preferred_broker';
const ROOM_CACHE_PREFIX = 'clipsync_cache_';

export function getStoredLastRoom(): string | null {
  try {
    return localStorage.getItem(LAST_ROOM_KEY);
  } catch {
    return null;
  }
}

export function setStoredLastRoom(room: string): void {
  try {
    localStorage.setItem(LAST_ROOM_KEY, room);
  } catch {
    // Ignore storage quota errors
  }
}

export function getRoomHistory(): RoomHistoryItem[] {
  try {
    const raw = localStorage.getItem(ROOM_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addRoomToHistory(room: string): void {
  try {
    const list = getRoomHistory().filter((r) => r.name !== room);
    const updated: RoomHistoryItem[] = [
      { name: room, lastVisited: Date.now() },
      ...list,
    ].slice(0, 10);
    localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function getStoredBroker(): string | null {
  try {
    return localStorage.getItem(BROKER_KEY);
  } catch {
    return null;
  }
}

export function setStoredBroker(brokerUrl: string): void {
  try {
    localStorage.setItem(BROKER_KEY, brokerUrl);
  } catch {
    // Ignore
  }
}

export function getCachedRoomState(room: string): SyncPayload | null {
  try {
    const raw = localStorage.getItem(`${ROOM_CACHE_PREFIX}${room}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedRoomState(room: string, payload: SyncPayload): void {
  try {
    localStorage.setItem(`${ROOM_CACHE_PREFIX}${room}`, JSON.stringify(payload));
  } catch {
    // Ignore
  }
}
