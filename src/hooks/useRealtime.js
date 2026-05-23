import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtime(table, callback, filter = {}) {
  const channelRef = useRef(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...filter,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, callback]);
}

export function usePresence(channelName, userData) {
  const presenceRef = useRef(null);

  useEffect(() => {
    presenceRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: userData.id,
        },
      },
    });

    presenceRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceRef.current.presenceState();
        console.log('Presence state:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceRef.current.track(userData);
        }
      });

    return () => {
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
      }
    };
  }, [channelName, userData]);
}