import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskLocation } from './useTasks';
import { useNotifications } from './useNotifications';
import { useToast } from './use-toast';

interface UseLocationReminderProps {
  tasks: Task[];
}

export const useLocationReminder = ({ tasks }: UseLocationReminderProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSupported, setLocationSupported] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const watchIdRef = useRef<number | null>(null);
  const notifiedLocationsRef = useRef<Set<string>>(new Set());
  const { showNotification, isEnabled } = useNotifications();
  const { toast } = useToast();

  // Check if there are any tasks with locations
  const tasksWithLocations = tasks.filter(t => t.location && t.status !== 'completed');
  const hasLocationTasks = tasksWithLocations.length > 0;

  useEffect(() => {
    setLocationSupported('geolocation' in navigator);
    
    // Check permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      }).catch(() => {
        // Permissions API not supported
      });
    }
  }, []);

  // Calculate distance between two coordinates in meters
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Check if user is near any task locations
  const checkLocationTriggers = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });

      tasksWithLocations.forEach((task) => {
        if (!task.location) return;

        const distance = calculateDistance(
          latitude,
          longitude,
          task.location.lat,
          task.location.lng
        );

        const taskKey = `${task.id}-${task.location.lat}-${task.location.lng}`;

        // Check if within radius and not already notified
        if (distance <= task.location.radius && !notifiedLocationsRef.current.has(taskKey)) {
          notifiedLocationsRef.current.add(taskKey);

          // Show notification
          if (isEnabled) {
            showNotification(`📍 ${task.title}`, {
              body: `You've arrived at ${task.location.name}`,
              tag: `location-${task.id}`,
              requireInteraction: true,
            });
          }

          toast({
            title: `📍 Location Reminder`,
            description: `${task.title} - You've arrived at ${task.location.name}`,
            duration: 30000,
          });
        }

        // Clear notification cache when user moves away (double the radius)
        if (distance > task.location.radius * 2) {
          notifiedLocationsRef.current.delete(taskKey);
        }
      });
    },
    [tasksWithLocations, calculateDistance, isEnabled, showNotification, toast]
  );

  const startWatching = useCallback(async () => {
    if (!locationSupported) {
      return false;
    }

    try {
      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        checkLocationTriggers,
        (error) => {
          console.error('Location error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
          }
          setIsWatching(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 30000,
        }
      );

      setIsWatching(true);
      setLocationPermission('granted');
      return true;
    } catch (error) {
      console.error('Failed to start location watching:', error);
      return false;
    }
  }, [locationSupported, checkLocationTriggers]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
    notifiedLocationsRef.current.clear();
  }, []);

  // Auto-start watching when there are location tasks and permission is granted
  useEffect(() => {
    if (hasLocationTasks && locationPermission === 'granted' && !isWatching && locationSupported) {
      startWatching();
    } else if (!hasLocationTasks && isWatching) {
      stopWatching();
    }
  }, [hasLocationTasks, locationPermission, isWatching, locationSupported, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isWatching,
    currentLocation,
    locationSupported,
    locationPermission,
    startWatching,
    stopWatching,
    hasLocationTasks,
  };
};