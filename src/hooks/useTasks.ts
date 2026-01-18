import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Task {
  id: string;
  title: string;
  taskType: 'deadline' | 'meeting' | 'one-time' | 'recurring';
  startDate?: string;
  endDate?: string;
  reminderTimes: string[];
  repeatRule?: string;
  status: 'active' | 'completed' | 'snoozed';
  createdAt: string;
  nextReminder?: string;
}

export interface ParsedTask {
  task_title: string;
  task_type: 'deadline' | 'meeting' | 'one-time' | 'recurring';
  start_date?: string;
  end_date?: string;
  reminder_times: string[];
  repeat_rule?: string;
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

      const mappedTasks: Task[] = (data || []).map((t) => ({
        id: t.id,
        title: t.title,
        taskType: t.task_type as Task['taskType'],
        startDate: t.start_date,
        endDate: t.end_date,
        reminderTimes: t.reminder_times || [],
        repeatRule: t.repeat_rule,
        status: t.status as Task['status'],
        createdAt: t.created_at,
        nextReminder: t.next_reminder ? formatNextReminder(t.next_reminder) : undefined,
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
      const nextReminder = calculateNextReminder(parsedTask.reminder_times[0], parsedTask.start_date);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: parsedTask.task_title,
          task_type: parsedTask.task_type,
          start_date: parsedTask.start_date || null,
          end_date: parsedTask.end_date || null,
          reminder_times: parsedTask.reminder_times,
          repeat_rule: parsedTask.repeat_rule || null,
          next_reminder: nextReminder,
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
        repeatRule: data.repeat_rule,
        status: data.status as Task['status'],
        createdAt: data.created_at,
        nextReminder: data.next_reminder ? formatNextReminder(data.next_reminder) : undefined,
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
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.reminderTimes !== undefined) dbUpdates.reminder_times = updates.reminderTimes;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
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
function formatNextReminder(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() ===
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function calculateNextReminder(time: string, startDate?: string): string {
  const now = new Date();
  const baseDate = startDate ? new Date(startDate) : now;
  
  // Parse time like "9:00 AM"
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    // Default to 9 AM
    baseDate.setHours(9, 0, 0, 0);
  } else {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    baseDate.setHours(hours, minutes, 0, 0);
  }

  // If the time has passed today, set for tomorrow
  if (baseDate <= now) {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return baseDate.toISOString();
}
