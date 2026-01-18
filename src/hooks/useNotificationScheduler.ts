import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/hooks/useTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

interface UseNotificationSchedulerProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

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
    if (!isEnabled) return;

    const now = new Date();
    const activeTasks = tasks.filter(
      (t) => t.status === 'active' || t.status === 'snoozed'
    );

    activeTasks.forEach((task) => {
      if (!task.nextReminder) return;
      
      // Parse the next reminder time
      const reminderMatch = task.nextReminder.match(
        /(?:Today|Tomorrow|([A-Za-z]+ \d+)), (\d{1,2}):(\d{2}) (AM|PM)/i
      );
      
      if (!reminderMatch) return;

      let reminderDate: Date;
      
      if (task.nextReminder.startsWith('Today')) {
        reminderDate = new Date();
      } else if (task.nextReminder.startsWith('Tomorrow')) {
        reminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Parse date like "Jan 20"
        reminderDate = new Date(`${reminderMatch[1]} ${now.getFullYear()}`);
      }

      // Parse time
      let hours = parseInt(reminderMatch[2]);
      const minutes = parseInt(reminderMatch[3]);
      const isPM = reminderMatch[4].toUpperCase() === 'PM';
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      reminderDate.setHours(hours, minutes, 0, 0);

      // Check if it's time to notify (within 1 minute window)
      const timeDiff = reminderDate.getTime() - now.getTime();
      const taskKey = `${task.id}-${reminderDate.getTime()}`;

      if (timeDiff >= 0 && timeDiff <= 60000 && !notifiedTasksRef.current.has(taskKey)) {
        notifiedTasksRef.current.add(taskKey);
        
        // Show browser notification
        const notification = showNotification(`🔔 ${task.title}`, {
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
          title: `🔔 ${task.title}`,
          description: task.endDate ? `Due: ${task.endDate}` : 'Time for your reminder!',
          duration: 30000,
        });
      }
    });
  }, [tasks, isEnabled, showNotification, toast]);

  useEffect(() => {
    // Check every 30 seconds for due tasks
    checkIntervalRef.current = setInterval(checkDueTasks, 30000);
    
    // Also check immediately
    checkDueTasks();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkDueTasks]);

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
};
