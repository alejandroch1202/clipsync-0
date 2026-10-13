import type { BrokerConfig } from '../types/sync';

export const BROKERS: BrokerConfig[] = [
  {
    id: 'emqx',
    name: 'EMQX Public (Primary)',
    url: 'wss://broker.emqx.io:8084/mqtt',
  },
  {
    id: 'hivemq',
    name: 'HiveMQ Public (Fallback)',
    url: 'wss://broker.hivemq.com:8884/mqtt',
  },
];

export const DEFAULT_BROKER = BROKERS[0];
export const FALLBACK_BROKER = BROKERS[1];

export const TOPIC_BASE_PREFIX = 'clipsync-app-v1-prod';

export function getRoomTopic(roomName: string): string {
  const sanitized = roomName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `${TOPIC_BASE_PREFIX}/${sanitized || 'general'}/state`;
}
