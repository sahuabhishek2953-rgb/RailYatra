import { useEffect, useRef } from 'react';
import { LiveStatus } from '@railyatra/types';
import { toast } from 'sonner';

const ALERT_THRESHOLD_KM = 50; // Notify when < 50km remaining
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // Re-alert only after 30 min

export function useArrivalAlert(liveStatus: LiveStatus | undefined, trainName: string) {
  const alertedRef = useRef<number>(0);
  const permissionRef = useRef<NotificationPermission>('default');

  // Request permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        permissionRef.current = p;
      });
    } else if ('Notification' in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  useEffect(() => {
    if (!liveStatus) return;

    const { distanceRemainingKm, status } = liveStatus;
    if (status === 'ARRIVED' || distanceRemainingKm <= 0) return;

    const now = Date.now();
    const cooldownElapsed = now - alertedRef.current > ALERT_COOLDOWN_MS;

    if (distanceRemainingKm <= ALERT_THRESHOLD_KM && cooldownElapsed) {
      alertedRef.current = now;

      const msg = `${trainName} is only ${distanceRemainingKm} km from destination!`;

      // Browser Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚆 Train Arriving Soon', {
          body: msg,
          icon: '/icons/icon-192.png',
          tag: 'arrival-alert'
        });
      }

      // Also show in-app toast
      toast.warning(`🚆 ${msg}`, {
        duration: 8000,
        description: 'Your destination is approaching.'
      });
    }
  }, [liveStatus?.distanceRemainingKm, trainName]);
}
