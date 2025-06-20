// src/components/layout/NotificationBell.tsx
"use client";

import { useState } from 'react';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationStore } from '@/store/notificationStore';
import Link from 'next/link';

export const NotificationBell = () => {
  const { notifications, markAsRead } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative">
          <Bell className="h-6 w-6 hover:text-red-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread messages.
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className={`text-sm p-2 rounded-md ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <p>{notification.message}</p>
                  <div className="text-xs text-right text-gray-400">
                    <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
                    {!notification.read && (
                       <button onClick={() => markAsRead(notification.id)} className="ml-2 font-bold text-blue-500">Mark as read</button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-500">No new notifications.</p>
            )}
          </div>
           <Link href="/notifications" className="text-center text-sm text-blue-600 hover:underline">
              View all notifications
            </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};