import React from 'react';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Task } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

// IST offset: UTC+5:30 = 330 minutes
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

interface UseNotificationSchedulerProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

// Get current time in IST
const nowIST = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60000);
};

// Format time in IST
export const formatTimeIST = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

// Format date in IST
export const formatDateIST = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
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
  const lastEODCheckRef = useRef<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);

  // Register service worker and listen for notification action messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[NotificationScheduler] Service Worker registered:', registration.scope);
      }).catch((error) => {
        console.log('[NotificationScheduler] Service Worker registration failed:', error);
      });

      // Listen for messages from service worker (notification actions)
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        const { type, action, taskId, minutes } = event.data;
        
        if (type === 'NOTIFICATION_ACTION') {
          console.log('[NotificationScheduler] Received notification action:', action, taskId, minutes);
          
          if (action === 'snooze' && taskId && minutes) {
            onSnooze(taskId, minutes);
            toast({
              title: `Snoozed for ${minutes} minutes`,
              description: 'We\'ll remind you again later.',
            });
          } else if (action === 'complete' && taskId) {
            onComplete(taskId);
            toast({
              title: 'Task completed! 🎉',
            });
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [onComplete, onSnooze, toast]);

  // Trigger notification helper with action buttons
  const triggerNotification = useCallback((task: Task, customTitle?: string, customBody?: string) => {
    const priorityEmoji = task.priority === 'urgent' ? '🔴' : 
                          task.priority === 'high' ? '🟠' : 
                          task.priority === 'medium' ? '🟡' : '🔵';
    
    const title = customTitle || `${priorityEmoji} ${task.title}`;
    const body = customBody || (task.endDate ? `Due: ${task.endDate}` : 'Task reminder');
    
    // Try to use notification with actions (requires service worker)
    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          tag: task.id,
          requireInteraction: true,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          actions: [
            { action: 'snooze30', title: '⏰ 30 min' },
            { action: 'snooze120', title: '⏰ 2 hours' },
            { action: 'complete', title: '✅ Done' },
          ],
          data: { taskId: task.id },
        } as NotificationOptions);
      }).catch(err => {
        console.log('[NotificationScheduler] Service worker notification failed, using fallback:', err);
        // Fallback to basic notification
        showBasicNotification(task, title, body);
      });
    } else {
      // Fallback for browsers without service worker support
      showBasicNotification(task, title, body);
    }

    // Always show in-app toast with action buttons
    showToastWithActions(task, title, body);
  }, []);

  // Basic notification without actions
  const showBasicNotification = useCallback((task: Task, title: string, body: string) => {
    const notification = showNotification(title, {
      body,
      tag: task.id,
      requireInteraction: true,
    });

    if (notification) {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [showNotification]);

  // In-app toast with action buttons
  const showToastWithActions = useCallback((task: Task, title: string, body: string) => {
    toast({
      title,
      description: (
        <div className="space-y-2">
          <p>{body}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onSnooze(task.id, 30);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              ⏰ 30 min
            </button>
            <button
              onClick={() => {
                onSnooze(task.id, 120);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              ⏰ 2 hours
            </button>
            <button
              onClick={() => {
                onComplete(task.id);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              ✅ Done
            </button>
          </div>
        </div>
      ),
      duration: 60000, // Keep visible for 1 minute
    });
  }, [toast, onComplete, onSnooze]);

  // Check for tasks that are due
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

    activeTasks.forEach((task) => {
      // Check reminder_times array - all should be ISO format now
      if (task.reminderTimes && task.reminderTimes.length > 0) {
        task.reminderTimes.forEach((reminderTime) => {
          // All reminder times should now be in ISO format
          const reminderDate = new Date(reminderTime);

          if (isNaN(reminderDate.getTime())) {
            console.log('[NotificationScheduler] Invalid reminder time:', reminderTime);
            return;
          }

          const timeDiff = reminderDate.getTime() - now.getTime();
          const taskKey = `${task.id}-${reminderDate.getTime()}`;

          // Log for debugging
          console.log(`[NotificationScheduler] Task "${task.title}" reminder: ${reminderTime}, diff: ${Math.round(timeDiff/1000)}s`);

          // Check if it's time to notify (within 2 minute window before and 1 minute after)
          if (timeDiff >= -120000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
            console.log(`[NotificationScheduler] TRIGGERING notification for: ${task.title}`);
            notifiedTasksRef.current.add(taskKey);
            triggerNotification(task);
          }
        });
      }

      // Also check next_reminder field as backup
      if (task.nextReminder) {
        // nextReminder is formatted for display, we need to check the raw value
        // Skip this check as reminder_times now contains the proper ISO dates
      }

      // Pre-alert for meetings (15 min before)
      if (task.taskType === 'meeting' || task.taskType === 'call') {
        task.reminderTimes.forEach((reminderTime) => {
          const meetingDate = new Date(reminderTime);
          if (isNaN(meetingDate.getTime())) return;
          
          const preAlertTime = meetingDate.getTime() - 15 * 60 * 1000; // 15 min before
          const timeDiff = preAlertTime - now.getTime();
          const preAlertKey = `${task.id}-prealert-${meetingDate.getTime()}`;

          if (timeDiff >= -60000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(preAlertKey)) {
            notifiedTasksRef.current.add(preAlertKey);
            triggerNotification(
              task,
              `⏰ ${task.title} in 15 minutes`,
              'Get ready for your upcoming meeting/call'
            );
          }
        });
      }
    });
  }, [tasks, isEnabled, triggerNotification]);

  // End of day review check
  const checkEndOfDayReview = useCallback(() => {
    if (!isEnabled) return;

    const istNow = nowIST();
    const todayKey = istNow.toISOString().split('T')[0];
    const currentHour = istNow.getHours();

    // Trigger EOD review at 8 PM IST
    if (currentHour === 20 && lastEODCheckRef.current !== todayKey) {
      lastEODCheckRef.current = todayKey;

      const todayPending = tasks.filter(t => {
        if (t.status === 'completed') return false;
        
        // Check if task was due today
        if (t.endDate === todayKey) return true;
        if (t.startDate === todayKey) return true;
        
        return false;
      });

      if (todayPending.length > 0) {
        setPendingTasks(todayPending);
        
        const notification = showNotification(
          `📋 End of Day Review`,
          {
            body: `You have ${todayPending.length} task${todayPending.length > 1 ? 's' : ''} pending today`,
            tag: 'eod-review',
            requireInteraction: true,
          }
        );

        if (notification) {
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        toast({
          title: `📋 End of Day Review`,
          description: `${todayPending.length} task${todayPending.length > 1 ? 's' : ''} pending today: ${todayPending.map(t => t.title).join(', ')}`,
          duration: 60000,
        });
      }
    }
  }, [tasks, isEnabled, showNotification, toast]);

  // Auto follow-up: Check for overdue tasks and send extra reminders
  const checkAutoFollowUp = useCallback(() => {
    if (!isEnabled) return;

    const now = new Date();
    
    tasks.forEach((task) => {
      if (task.status === 'completed') return;

      // Check if task has a past reminder that wasn't completed
      task.reminderTimes.forEach((reminderTime) => {
        const reminderDate = new Date(reminderTime);
        if (isNaN(reminderDate.getTime())) return;
        
        const hoursSinceReminder = (now.getTime() - reminderDate.getTime()) / (1000 * 60 * 60);
        
        // Send follow-up 1 hour after missed reminder
        if (hoursSinceReminder >= 1 && hoursSinceReminder < 1.1) {
          const followUpKey = `${task.id}-followup-${reminderDate.getTime()}`;
          
          if (!notifiedTasksRef.current.has(followUpKey)) {
            notifiedTasksRef.current.add(followUpKey);
            triggerNotification(
              task,
              `⏰ Follow-up: ${task.title}`,
              'This task is still pending. Need to complete it?'
            );
          }
        }
      });
    });
  }, [tasks, isEnabled, triggerNotification]);

  useEffect(() => {
    // Check every 15 seconds for due tasks
    checkIntervalRef.current = setInterval(() => {
      checkDueTasks();
      checkEndOfDayReview();
      checkAutoFollowUp();
    }, 15000);
    
    // Check immediately
    checkDueTasks();
    checkEndOfDayReview();
    
    console.log('[NotificationScheduler] Started monitoring', tasks.length, 'tasks');

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkDueTasks, checkEndOfDayReview, checkAutoFollowUp, tasks.length]);

  // Cleanup old notified tasks
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      notifiedTasksRef.current = new Set(
        Array.from(notifiedTasksRef.current).filter((key) => {
          const parts = key.split('-');
          const timestamp = parseInt(parts[parts.length - 1] || '0');
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
    pendingTasks,
  };
};
