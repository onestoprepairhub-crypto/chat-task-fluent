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

  // Trigger notification helper
  const triggerNotification = useCallback((task: Task, customTitle?: string, customBody?: string) => {
    const priorityEmoji = task.priority === 'urgent' ? '🔴' : 
                          task.priority === 'high' ? '🟠' : 
                          task.priority === 'medium' ? '🟡' : '🔵';
    
    const title = customTitle || `${priorityEmoji} ${task.title}`;
    const body = customBody || (task.endDate ? `Due: ${task.endDate}` : 'Task reminder');
    
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

    toast({
      title,
      description: body,
      duration: 30000,
    });
  }, [showNotification, toast]);

  // Check for tasks that are due
  const checkDueTasks = useCallback(() => {
    if (!isEnabled) {
      console.log('[NotificationScheduler] Notifications not enabled');
      return;
    }

    const now = new Date();
    const istNow = nowIST();
    console.log('[NotificationScheduler] Checking tasks at:', now.toISOString(), 'IST:', istNow.toISOString());
    
    const activeTasks = tasks.filter(
      (t) => t.status === 'active' || t.status === 'snoozed'
    );

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
            return;
          }

          const timeDiff = reminderDate.getTime() - now.getTime();
          const taskKey = `${task.id}-${reminderDate.getTime()}`;

          // Check if it's time to notify (within 2 minute window)
          if (timeDiff >= -120000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
            console.log(`[NotificationScheduler] Triggering notification for: ${task.title}`);
            notifiedTasksRef.current.add(taskKey);
            triggerNotification(task);
          }
        });
      }

      // Also check next_reminder field
      if (task.nextReminder) {
        let reminderDate: Date | null = null;

        if (task.nextReminder.includes('T') || task.nextReminder.match(/^\d{4}-\d{2}-\d{2}/)) {
          reminderDate = new Date(task.nextReminder);
        }

        if (reminderDate && !isNaN(reminderDate.getTime())) {
          const timeDiff = reminderDate.getTime() - now.getTime();
          const taskKey = `${task.id}-next-${reminderDate.getTime()}`;

          if (timeDiff >= -120000 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
            console.log(`[NotificationScheduler] Triggering notification for next_reminder: ${task.title}`);
            notifiedTasksRef.current.add(taskKey);
            triggerNotification(task);
          }
        }
      }

      // Pre-alert for meetings (15 min before)
      if (task.taskType === 'meeting' || task.taskType === 'call') {
        task.reminderTimes.forEach((reminderTime) => {
          if (!reminderTime.includes('T')) return;
          
          const meetingDate = new Date(reminderTime);
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
        if (!reminderTime.includes('T')) return;
        
        const reminderDate = new Date(reminderTime);
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
