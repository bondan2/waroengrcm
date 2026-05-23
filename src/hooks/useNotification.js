import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAudio } from './useAudio';

export function useNotification() {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const { play, toggleMute, isMuted } = useAudio();

  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // Play sound
          play(notification.type === 'order' ? 'newOrder' : 
               notification.type === 'payment' ? 'paymentSuccess' : 'notification');

          // Show toast
          addToast({
            type: notification.type === 'order' ? 'success' :
                  notification.type === 'payment' ? 'success' :
                  notification.type === 'table' ? 'info' : 'info',
            message: notification.message,
            title: notification.title,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addToast, play]);

  useEffect(() => {
    const cleanup = subscribeToNotifications();
    return () => {
      if (cleanup) cleanup();
    };
  }, [subscribeToNotifications]);

  return { toggleMute, isMuted };
}