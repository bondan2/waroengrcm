import { useRef, useCallback } from 'react';

const sounds = {
  newOrder: '/sounds/new-order.mp3',
  paymentSuccess: '/sounds/payment-success.mp3',
  tableActive: '/sounds/table-active.mp3',
  orderReady: '/sounds/order-ready.mp3',
  notification: '/sounds/notification.mp3',
};

export function useAudio() {
  const audioRef = useRef(null);
  const isMutedRef = useRef(false);

  const play = useCallback((soundName) => {
    if (isMutedRef.current) return;
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(sounds[soundName] || sounds.notification);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    return isMutedRef.current;
  }, []);

  const isMuted = useCallback(() => isMutedRef.current, []);

  return { play, toggleMute, isMuted };
}