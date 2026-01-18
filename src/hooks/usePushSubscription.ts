import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const usePushSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check existing subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('[PushSubscription] Error checking subscription:', error);
      }
      
      setIsLoading(false);
    };

    checkSubscription();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please sign in to enable push notifications.',
        variant: 'destructive',
      });
      return false;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);

      // Get VAPID public key from edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke('web-push', {
        body: { action: 'getPublicKey' },
      });

      if (keyError || !keyData?.publicKey) {
        console.error('[PushSubscription] Failed to get VAPID key:', keyError);
        throw new Error('Failed to get push configuration');
      }

      const vapidPublicKey = keyData.publicKey;
      console.log('[PushSubscription] Got VAPID public key');

      // Register service worker if not already
      const registration = await navigator.serviceWorker.ready;
      console.log('[PushSubscription] Service worker ready');

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('[PushSubscription] Push subscription created:', pushSubscription.endpoint);

      // Get subscription JSON for storage
      const subscriptionJSON = pushSubscription.toJSON();
      
      // Save subscription to backend
      const { error: saveError } = await supabase.functions.invoke('web-push', {
        body: {
          action: 'subscribe',
          userId: user.id,
          subscription: {
            endpoint: subscriptionJSON.endpoint,
            keys: subscriptionJSON.keys,
          },
        },
      });

      if (saveError) {
        console.error('[PushSubscription] Failed to save subscription:', saveError);
        throw new Error('Failed to save push subscription');
      }

      setSubscription(pushSubscription);
      setIsSubscribed(true);

      toast({
        title: 'Push Notifications Enabled! 🔔',
        description: 'You\'ll receive notifications even when the app is closed.',
      });

      return true;
    } catch (error) {
      console.error('[PushSubscription] Error subscribing:', error);
      toast({
        title: 'Subscription Failed',
        description: error instanceof Error ? error.message : 'Failed to enable push notifications.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Unsubscribe from push
  const unsubscribeFromPush = useCallback(async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive push notifications.',
        });
      } catch (error) {
        console.error('[PushSubscription] Error unsubscribing:', error);
      }
    }
  }, [subscription, toast]);

  // Send a push notification (for testing or scheduled notifications)
  const sendPushNotification = useCallback(async (
    taskId: string,
    title: string,
    body: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke('web-push', {
        body: {
          userId: user.id,
          taskId,
          title,
          body,
        },
      });

      if (error) {
        console.error('[PushSubscription] Send notification error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PushSubscription] Error sending notification:', error);
      return false;
    }
  }, [user]);

  return {
    isSubscribed,
    isLoading,
    subscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendPushNotification,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray.buffer;
}
