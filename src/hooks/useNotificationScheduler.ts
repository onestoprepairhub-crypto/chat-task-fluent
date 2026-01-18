import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

// IST offset: UTC+5:30 = 330 minutes
const IST_OFFSET_MINUTES = 330;

interface UseNotificationSchedulerProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

// Convert UTC date to IST
const toIST = (date: Date): Date => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MINUTES * 60000);
};

// Get current time in IST
const nowIST = (): Date => {
  return toIST(new Date());
};

// Format time in IST
export const formatTimeIST = (date: Date): string => {
  const istDate = toIST(date);
  return istDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

// Format date in IST
export const formatDateIST = (date: Date): string => {
  const istDate = toIST(date);
  return istDate.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

export const useNotificationScheduler = ({
  tasks,
  onComplete,
  onSnooze,
}: UseNotificationSchedulerProps) => {
  const { isEnabled, showNotification } = useNotifications();
  const { toast } = useToast();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  const checkDueTasks = useCallback(() => {
    if (!isEnabled) {
      console.log('[NotificationScheduler] Notifications not enabled');
      return;
    }

    const now = new Date();
    console.log('[NotificationScheduler] Checking tasks at:', now.toISOString());
    
    const activeTasks = tasks.filter(
      (t) => t.status === 'active' || t.status === 'snoozed'
    );

    console.log('[NotificationScheduler] Active tasks with reminders:', activeTasks.length);

    activeTasks.forEach((task) => {
      // Check reminder_times array for time-based reminders
      if (task.reminderTimes && task.reminderTimes.length > 0) {
        task.reminderTimes.forEach((reminderTime) => {
          let reminderDate: Date | null = null;

          // Check if it's an ISO date string
          if (reminderTime.includes('T') || reminderTime.includes('-')) {
            reminderDate = new Date(reminderTime);
          } else {
            // Parse simple time format like "9:20 AM"
            const timeMatch = reminderTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const isPM = timeMatch[3].toUpperCase() === 'PM';
              
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
              
              reminderDate = new Date();
              reminderDate.setHours(hours, minutes, 0, 0);
            }
          }

          if (!reminderDate || isNaN(reminderDate.getTime())) {
            console.log('[NotificationScheduler] Invalid reminder time:', reminderTime);
            return;
          }

          const timeDiff = reminderDate.getTime() - now.getTime();
          const taskKey = `${task.id}-${reminderDate.getTime()}`;

          console.log(`[NotificationScheduler] Task "${task.title}": reminder at ${reminderDate.toISOString()}, diff: ${timeDiff}ms`);

          // Check if it's time to notify (within 2 minute window - past or upcoming)
          if (timeDiff >= -120000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
            console.log(`[NotificationScheduler] Triggering notification for: ${task.title}`);
            notifiedTasksRef.current.add(taskKey);
            
            triggerNotification(task);
          }
        });
      }

      // Also check next_reminder field (database ISO format)
      if (task.nextReminder) {
        let reminderDate: Date | null = null;

        // Try parsing as ISO date
        if (task.nextReminder.includes('T') || task.nextReminder.match(/^\d{4}-\d{2}-\d{2}/)) {
          reminderDate = new Date(task.nextReminder);
        }

        if (reminderDate && !isNaN(reminderDate.getTime())) {
          const timeDiff = reminderDate.getTime() - now.getTime();
          const taskKey = `${task.id}-next-${reminderDate.getTime()}`;

          console.log(`[NotificationScheduler] Task "${task.title}" next_reminder: ${reminderDate.toISOString()}, diff: ${timeDiff}ms`);

          if (timeDiff >= -120000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
            console.log(`[NotificationScheduler] Triggering notification for next_reminder: ${task.title}`);
            notifiedTasksRef.current.add(taskKey);
            
            triggerNotification(task);
          }
        }
      }
    });
  }, [tasks, isEnabled, showNotification, toast]);

  const triggerNotification = useCallback((task: Task) => {
    // Get priority indicator
    const priorityEmoji = task.priority === 'urgent' ? '🔴' : 
                          task.priority === 'high' ? '🟠' : 
                          task.priority === 'medium' ? '🟡' : '🔵';
    
    // Show browser notification
    const notification = showNotification(`${priorityEmoji} ${task.title}`, {
      body: task.endDate ? `Due: ${task.endDate}` : 'Task reminder',
      tag: task.id,
      requireInteraction: true,
    });

    if (notification) {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Also show in-app toast
    toast({
      title: `${priorityEmoji} ${task.title}`,
      description: task.endDate ? `Due: ${task.endDate}` : 'Time for your reminder!',
      duration: 30000,
    });
  }, [showNotification, toast]);

  useEffect(() => {
    // Check every 15 seconds for due tasks (more responsive)
    checkIntervalRef.current = setInterval(checkDueTasks, 15000);
    
    // Also check immediately
    checkDueTasks();
    
    console.log('[NotificationScheduler] Started monitoring', tasks.length, 'tasks');

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkDueTasks, tasks.length]);

  // Cleanup old notified tasks
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      notifiedTasksRef.current = new Set(
        Array.from(notifiedTasksRef.current).filter((key) => {
          const timestamp = parseInt(key.split('-').pop() || '0');
          return timestamp > oneHourAgo;
        })
      );
    }, 3600000);

    return () => clearInterval(cleanup);
  }, []);

  return {
    nowIST,
    formatTimeIST,
    formatDateIST,
  };
};
