'use client';

import { create } from 'zustand';

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  stock: number;
  time: Date;
  read: boolean;
}

interface NotificationState {
  notifications: StockNotification[];
  unreadCount: number;
  addStockAlert: (productId: string, productName: string, stock: number) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  addStockAlert: (productId, productName, stock) =>
    set((state) => {
      // No duplicar si ya hay alerta no leída para este producto
      const alreadyUnread = state.notifications.some(
        (n) => n.productId === productId && !n.read,
      );
      if (alreadyUnread) return state;

      const notification: StockNotification = {
        id: `${productId}-${Date.now()}`,
        productId,
        productName,
        stock,
        time: new Date(),
        read: false,
      };

      const notifications = [notification, ...state.notifications].slice(0, 20);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
