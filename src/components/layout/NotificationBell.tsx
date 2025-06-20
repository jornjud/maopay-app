// src/components/layout/NotificationBell.tsx
"use client";

import { useState } from 'react';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // <--- ตอนนี้จะ import ผ่านแล้ว
import { useNotificationStore } from '@/store/notificationStore';
import Link from 'next/link';
import { Button } from '../ui/button';

export const NotificationBell = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2">
          <Bell className="h-6 w-6 hover:text-red-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread messages.
            </p>
          </div>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map(notification => (
                <div key={notification.id} className={`text-sm p-2 rounded-md ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <p>{notification.message}</p>
                  <div className="text-xs text-right text-gray-400 mt-1">
                    <span>{new Date(notification.timestamp).toLocaleString()}</span>
                    {!notification.read && (
                       <button onClick={() => markAsRead(notification.id)} className="ml-2 font-bold text-blue-500 hover:underline">Mark as read</button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-500 py-4">No new notifications.</p>
            )}
          </div>
          <div className="flex justify-between items-center mt-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>Mark all as read</Button>
            <Link href="/notifications" passHref>
               <Button variant="default" size="sm">View All</Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};