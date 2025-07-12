
import { useState, useEffect, useCallback } from 'react';
import { getCurrentISTISOString } from '@/lib/timezone-utils';

export interface PushNotificationData {
  title: string;
  message: string;
  orderId?: number;
  status?: string;
  icon?: string;
  badge?: string;
}

interface NotificationState {
  permission: NotificationPermission | null;
  isSupported: boolean;
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: null,
    isSupported: false,
    isSubscribed: false,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    
    setNotificationState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : null,
    }));
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!notificationState.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [notificationState.isSupported]);

  // Show notification
  const showNotification = useCallback(async (data: PushNotificationData): Promise<boolean> => {
    if (!notificationState.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (notificationState.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: data.icon || '/favicon.png',
        badge: data.badge || '/favicon.png',
        tag: data.orderId ? `order-${data.orderId}` : 'millet-meals',
        requireInteraction: true,
        silent: false,
        data: {
          orderId: data.orderId,
          status: data.status,
          timestamp: getCurrentISTISOString(),
        },
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to order tracking if orderId is provided
        if (data.orderId) {
          window.location.href = `/orders/${data.orderId}/tracking`;
        }
        
        notification.close();
      };

      // Auto-close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [notificationState.permission, notificationState.isSupported, requestPermission]);

  // Setup order tracking notifications
  const setupOrderNotifications = useCallback((orderId: number) => {
    if (!notificationState.isSupported || notificationState.permission !== 'granted') {
      return;
    }

    // Setup EventSource for real-time notifications
    const eventSource = new EventSource(`/api/orders/${orderId}/tracking/live`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status_update') {
          const notificationData: PushNotificationData = {
            title: 'Order Update',
            message: getStatusMessage(data.status),
            orderId: data.orderId,
            status: data.status,
          };
          
          showNotification(notificationData);
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    eventSource.onerror = () => {
      console.warn('Notification event source connection lost');
      eventSource.close();
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }, [notificationState.isSupported, notificationState.permission, showNotification]);

  // Test notification
  const sendTestNotification = useCallback(async () => {
    return await showNotification({
      title: 'Millet Meals',
      message: 'Notifications are working! You\'ll receive updates about your orders.',
    });
  }, [showNotification]);

  return {
    ...notificationState,
    requestPermission,
    showNotification,
    setupOrderNotifications,
    sendTestNotification,
  };
}

// Helper function to get user-friendly status messages
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    confirmed: 'Your order has been confirmed! 📋',
    preparing: 'Your millet meal is being prepared 👨‍🍳',
    in_transit: 'Your order is on the way! 🚛',
    out_for_delivery: 'Out for delivery - arriving soon! 🏃‍♂️',
    nearby: 'Your delivery partner is nearby (5 mins) 📍',
    delivered: 'Order delivered! Enjoy your meal! ✅',
  };
  return messages[status] || 'Order status updated';
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    deliveryNotifications: true,
    promotions: false,
    soundEnabled: true,
  });

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = useCallback((newPreferences: Partial<typeof preferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      localStorage.setItem('notification-preferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    preferences,
    updatePreferences,
  };
}