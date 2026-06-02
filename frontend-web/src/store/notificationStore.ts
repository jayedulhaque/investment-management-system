import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { create } from 'zustand';
import { apiFetch, getStoredToken } from '../lib/api';
import { hubUrl } from '../lib/config';

const CAMPAIGN_ACTIVATED = 'CampaignActivated';

type NotificationState = {
  unreadCount: number;
  connection: HubConnection | null;
  fetchUnread: () => Promise<void>;
  connectHub: () => Promise<void>;
  disconnectHub: () => Promise<void>;
  incrementUnread: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  connection: null,

  fetchUnread: async () => {
    if (!getStoredToken()) return;
    const data = await apiFetch<{ count: number }>('/api/notifications/unread-count');
    set({ unreadCount: data.count });
  },

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  connectHub: async () => {
    const token = getStoredToken();
    if (!token || get().connection) return;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => getStoredToken() ?? '' })
      .withAutomaticReconnect()
      .build();

    connection.on(CAMPAIGN_ACTIVATED, () => get().incrementUnread());

    await connection.start();
    set({ connection });
    await get().fetchUnread();
  },

  disconnectHub: async () => {
    const conn = get().connection;
    if (conn) await conn.stop();
    set({ connection: null, unreadCount: 0 });
  },
}));
