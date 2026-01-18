import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isStandalone = () => {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
    ((window.navigator as any).standalone === true);
};

const getIOSVersion = () => {
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : 0;
};

export const useNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [iosInfo, setIosInfo] = useState<{ isIOS: boolean; isStandalone: boolean; version: number } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const iosDevice = isIOS();
    const standalone = isStandalone();
    const version = getIOSVersion();
    
    setIosInfo({ isIOS: iosDevice, isStandalone: standalone, version });

    // Check if notifications are supported
    if ('Notification' in window) {
      // iOS Safari 16.4+ supports notifications only in standalone (PWA) mode
      if (iosDevice) {
        if (version >= 16 && standalone) {
          setIsSupported(true);
          setPermissionStatus(Notification.permission);
        } else {
          setIsSupported(false);
        }
      } else {
        setIsSupported(true);
        setPermissionStatus(Notification.permission);
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (iosInfo?.isIOS && !iosInfo.isStandalone) {
      if (iosInfo.version < 16) {
        toast({
          title: 'Update Required',
          description: 'Push notifications require iOS 16.4 or later. Please update your device.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Add to Home Screen',
          description: 'To enable notifications on iOS, tap the Share button and select "Add to Home Screen", then open the app from there.',
          duration: 8000,
        });
      }
      return false;
    }

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
  }, [isSupported, iosInfo, toast]);

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

  const needsHomeScreenInstall = iosInfo?.isIOS && !iosInfo.isStandalone && iosInfo.version >= 16;

  return {
    permissionStatus,
    isSupported,
    isEnabled: permissionStatus === 'granted',
    requestPermission,
    showNotification,
    sendTestNotification,
    iosInfo,
    needsHomeScreenInstall,
  };
};
