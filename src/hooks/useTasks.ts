import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const TASK_TYPES = [
  { value: 'general', label: 'General', icon: 'Circle' },
  { value: 'deadline', label: 'Deadline', icon: 'Clock' },
  { value: 'meeting', label: 'Meeting', icon: 'Calendar' },
  { value: 'one-time', label: 'One-time', icon: 'Bell' },
  { value: 'recurring', label: 'Recurring', icon: 'Repeat' },
  { value: 'reminder', label: 'Reminder', icon: 'BellRing' },
  { value: 'location', label: 'Location', icon: 'MapPin' },
  { value: 'habit', label: 'Habit', icon: 'Flame' },
  { value: 'goal', label: 'Goal', icon: 'Target' },
  { value: 'project', label: 'Project', icon: 'FolderKanban' },
  { value: 'errand', label: 'Errand', icon: 'ShoppingBag' },
  { value: 'call', label: 'Call', icon: 'Phone' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'payment', label: 'Payment', icon: 'CreditCard' },
  { value: 'health', label: 'Health', icon: 'Heart' },
  { value: 'exercise', label: 'Exercise', icon: 'Dumbbell' },
  { value: 'study', label: 'Study', icon: 'GraduationCap' },
] as const;

export const REPEAT_RULES = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'weekends', label: 'Weekends (Sat-Sun)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground', bg: 'bg-muted' },
  { value: 'medium', label: 'Medium', color: 'text-primary', bg: 'bg-primary/15' },
  { value: 'high', label: 'High', color: 'text-warning', bg: 'bg-warning/15' },
  { value: 'urgent', label: 'Urgent', color: 'text-destructive', bg: 'bg-destructive/15' },
] as const;

export const TIME_ESTIMATES = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
] as const;

export type TaskType = typeof TASK_TYPES[number]['value'];
export type RepeatRule = typeof REPEAT_RULES[number]['value'];
export type Priority = typeof PRIORITY_LEVELS[number]['value'];

export interface TaskLocation {
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
}

export interface Task {
  id: string;
  title: string;
  taskType: TaskType;
  startDate?: string;
  endDate?: string;
  reminderTimes: string[];
  repeatRule?: RepeatRule;
  status: 'active' | 'completed' | 'snoozed';
  createdAt: string;
  nextReminder?: string;
  priority: Priority;
  estimatedMinutes?: number;
  location?: TaskLocation;
}

export interface ParsedTask {
  task_title: string;
  task_type: 'deadline' | 'meeting' | 'one-time' | 'recurring' | 'location' | 'call' | 'email' | 'reminder';
  start_date?: string;
  end_date?: string;
  reminder_times: string[];
  repeat_rule?: string;
  priority?: Priority;
  is_location_task?: boolean;
  location_name?: string;
}

const PARSE_TASK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-task`;

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch tasks from database
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsFetching(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTasks: Task[] = (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        taskType: t.task_type as Task['taskType'],
        startDate: t.start_date,
        endDate: t.end_date,
        reminderTimes: t.reminder_times || [],
        repeatRule: (t.repeat_rule || 'none') as RepeatRule,
        status: t.status as Task['status'],
        createdAt: t.created_at,
        nextReminder: t.next_reminder ? formatNextReminder(t.next_reminder) : undefined,
        priority: (t.priority || 'medium') as Priority,
        estimatedMinutes: t.estimated_minutes || undefined,
        location: t.location_name && t.location_lat && t.location_lng ? {
          name: t.location_name,
          lat: t.location_lat,
          lng: t.location_lng,
          radius: t.location_radius || 100,
        } : undefined,
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const parseTask = useCallback(async (input: string): Promise<ParsedTask> => {
    setIsLoading(true);
    try {
      const response = await fetch(PARSE_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw new Error(errorData.error || 'Failed to parse task');
      }

      const parsed = await response.json();
      return parsed;
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to understand task',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addTask = useCallback(async (parsedTask: ParsedTask) => {
    if (!user) return;

    try {
      // Convert all reminder times to ISO format for proper scheduling
      const isoReminderTimes = convertReminderTimesToISO(
        parsedTask.reminder_times, 
        parsedTask.start_date
      );
      
      // Use the first ISO reminder as next_reminder
      const nextReminder = isoReminderTimes[0] || calculateNextReminder(
        parsedTask.reminder_times[0], 
        parsedTask.start_date
      );

      console.log('[addTask] Saving task with ISO reminder times:', isoReminderTimes);
      console.log('[addTask] Next reminder:', nextReminder);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: parsedTask.task_title,
          task_type: parsedTask.task_type,
          start_date: parsedTask.start_date || null,
          end_date: parsedTask.end_date || null,
          reminder_times: isoReminderTimes, // Store as ISO strings
          repeat_rule: parsedTask.repeat_rule || null,
          next_reminder: nextReminder,
          priority: parsedTask.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        taskType: data.task_type as Task['taskType'],
        startDate: data.start_date,
        endDate: data.end_date,
        reminderTimes: data.reminder_times || [],
        repeatRule: (data.repeat_rule || 'none') as RepeatRule,
        status: data.status as Task['status'],
        createdAt: data.created_at,
        nextReminder: data.next_reminder ? formatNextReminder(data.next_reminder) : undefined,
        priority: (data.priority || 'medium') as Priority,
        estimatedMinutes: data.estimated_minutes || undefined,
        location: data.location_name && data.location_lat && data.location_lng ? {
          name: data.location_name,
          lat: data.location_lat,
          lng: data.location_lng,
          radius: data.location_radius || 100,
        } : undefined,
      };

      setTasks((prev) => [newTask, ...prev]);
      
      toast({
        title: 'Task added!',
        description: parsedTask.task_title,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'Failed to save task',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: 'completed' as const } : task
        )
      );

      toast({
        title: 'Task completed! 🎉',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const snoozeTask = useCallback(async (taskId: string, minutes: number) => {
    try {
      const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'snoozed',
          next_reminder: snoozeTime,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: 'snoozed' as const,
              nextReminder: formatNextReminder(snoozeTime),
            };
          }
          return task;
        })
      );

      toast({
        title: `Snoozed for ${minutes} minutes`,
      });
    } catch (error) {
      console.error('Error snoozing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze task',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      toast({
        title: 'Task deleted',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
      
      if (updates.reminderTimes !== undefined) {
        // Convert all reminder times to ISO format
        const isoReminderTimes = convertReminderTimesToISO(
          updates.reminderTimes,
          updates.startDate
        );
        dbUpdates.reminder_times = isoReminderTimes;
        
        // Set next_reminder to the first future reminder
        if (isoReminderTimes.length > 0) {
          const now = new Date();
          const futureReminder = isoReminderTimes.find(r => new Date(r) > now);
          dbUpdates.next_reminder = futureReminder || isoReminderTimes[0];
        }
        
        console.log('[updateTask] Updated reminder times:', isoReminderTimes);
        console.log('[updateTask] Next reminder:', dbUpdates.next_reminder);
      }
      
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.taskType !== undefined) dbUpdates.task_type = updates.taskType;
      if (updates.repeatRule !== undefined) dbUpdates.repeat_rule = updates.repeatRule === 'none' ? null : updates.repeatRule;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes || null;
      
      // Handle location updates
      if (updates.location !== undefined) {
        if (updates.location) {
          dbUpdates.location_name = updates.location.name;
          dbUpdates.location_lat = updates.location.lat;
          dbUpdates.location_lng = updates.location.lng;
          dbUpdates.location_radius = updates.location.radius;
        } else {
          dbUpdates.location_name = null;
          dbUpdates.location_lat = null;
          dbUpdates.location_lng = null;
          dbUpdates.location_radius = null;
        }
      }

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      // Update local state with formatted times
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const updated = { ...task, ...updates };
            if (dbUpdates.next_reminder) {
              updated.nextReminder = formatNextReminder(dbUpdates.next_reminder);
            }
            return updated;
          }
          return task;
        })
      );

      toast({
        title: 'Task updated',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const activeTasks = tasks.filter((t) => t.status === 'active' || t.status === 'snoozed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return {
    tasks,
    activeTasks,
    completedTasks,
    isLoading,
    isFetching,
    parseTask,
    addTask,
    completeTask,
    snoozeTask,
    deleteTask,
    updateTask,
    refetch: fetchTasks,
  };
};

// Helper functions

// Format next reminder for display (converts UTC to IST)
function formatNextReminder(isoString: string): string {
  // Parse the UTC time
  const utcDate = new Date(isoString);
  
  // Convert to IST for display
  const istTime = utcDate.getTime() + (IST_OFFSET_MINUTES * 60 * 1000);
  const istDate = new Date(istTime);
  
  // Get "now" in IST for comparison
  const now = new Date();
  const nowUTC = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const nowIST = new Date(nowUTC + (IST_OFFSET_MINUTES * 60 * 1000));
  
  // Compare dates in IST
  const isToday = istDate.toDateString() === nowIST.toDateString();
  const tomorrow = new Date(nowIST);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = istDate.toDateString() === tomorrow.toDateString();

  // Format time in IST
  const timeStr = istDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return `${istDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}, ${timeStr}`;
}

// IST offset: UTC+5:30 = 330 minutes
const IST_OFFSET_MINUTES = 330;

// Convert IST time to UTC ISO string
function istToUTC(istDate: Date): string {
  // Subtract IST offset to get UTC
  const utcTime = istDate.getTime() - (IST_OFFSET_MINUTES * 60 * 1000);
  return new Date(utcTime).toISOString();
}

// Get current time in IST
function getNowIST(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + (IST_OFFSET_MINUTES * 60 * 1000));
}

// Parse time string and return IST Date object
function parseTimeToIST(time: string, baseDate: Date): Date | null {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === 'PM';
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function calculateNextReminder(time: string, startDate?: string): string {
  const nowIST = getNowIST();
  
  // If time is already ISO format, return as-is
  if (time.includes('T')) {
    return time;
  }
  
  // Parse the base date in IST
  let baseDate: Date;
  if (startDate) {
    // startDate is in YYYY-MM-DD format, treat as IST date
    const [year, month, day] = startDate.split('-').map(Number);
    baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    baseDate = new Date(nowIST);
  }
  
  // Parse time like "9:00 AM"
  const parsedTime = parseTimeToIST(time, baseDate);
  if (!parsedTime) {
    // Default to 9 AM IST
    baseDate.setHours(9, 0, 0, 0);
  } else {
    baseDate = parsedTime;
  }

  // If the time has passed today (in IST), set for tomorrow
  if (baseDate <= nowIST && !startDate) {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  // Convert IST to UTC for storage
  return istToUTC(baseDate);
}

// Convert simple time to full ISO string for storage (used by addTask)
export function convertReminderTimesToISO(reminderTimes: string[], startDate?: string): string[] {
  const nowIST = getNowIST();
  
  return reminderTimes.map(time => {
    // Already ISO format
    if (time.includes('T')) {
      return time;
    }
    
    // Parse the base date in IST
    let baseDate: Date;
    if (startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      baseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      baseDate = new Date(nowIST);
    }
    
    // Parse time
    const parsedTime = parseTimeToIST(time, baseDate);
    if (!parsedTime) {
      baseDate.setHours(9, 0, 0, 0);
    } else {
      baseDate = parsedTime;
    }
    
    // If time has passed today, set for tomorrow (only if no specific date)
    if (baseDate <= nowIST && !startDate) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    
    return istToUTC(baseDate);
  });
}
