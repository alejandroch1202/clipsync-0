export interface NoteCard {
  id: string;
  content: string;
  createdAt: number;
  pinned?: boolean;
}

export interface SyncPayload {
  scratchpad: string;
  cards: NoteCard[];
  updatedAt: number;
  senderId: string; // Random memory ID per tab (crypto.randomUUID())
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

export interface BrokerConfig {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
}

export interface RoomHistoryItem {
  name: string;
  lastVisited: number;
}
