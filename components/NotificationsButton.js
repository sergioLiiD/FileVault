'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function NotificationsButton() {
  const [totalUnread, setTotalUnread] = useState(false);

  useEffect(() => {
    const fetchUnreadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('has_total_unread_messages')
        .single();

      if (!error) {
        setTotalUnread(data || false);
      }
    };

    fetchUnreadStatus();

    const channel = supabase
      .channel('header_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages'
        },
        () => {
          fetchUnreadStatus();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
    >
      <Bell className={cn(
        "h-5 w-5",
        totalUnread ? "text-red-500" : "text-gray-500"
      )} />
      {totalUnread && totalUnread.unread_count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {totalUnread.unread_count}
        </span>
      )}
    </Button>
  );
} 