import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Notifications Enabled! 🔔',
        description: 'You\'ll receive reminders for your tasks.',
      });

      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isSupported, toast]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permissionStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    return notification;
  }, [permissionStatus]);

  const sendTestNotification = useCallback(() => {
    if (permissionStatus !== 'granted') {
      toast({
        title: 'Enable Notifications First',
        description: 'Please enable notifications before testing.',
        variant: 'destructive',
      });
      return;
    }

    showNotification('Test Notification', {
      body: 'This is a test notification from Task Reminder!',
      tag: 'test-notification',
    });

    toast({
      title: 'Test Sent!',
      description: 'Check for a notification on your device.',
    });
  }, [permissionStatus, showNotification, toast]);

  return {
    permissionStatus,
    isSupported,
    isEnabled: permissionStatus === 'granted',
    requestPermission,
    showNotification,
    sendTestNotification,
  };
};
