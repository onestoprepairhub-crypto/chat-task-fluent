import { useState, useCallback } from 'react';
import { Task, ParsedTask } from '@/types/task';

// Mock AI parsing - in production this would call the backend
const mockParseTask = (input: string): ParsedTask => {
  const lowerInput = input.toLowerCase();
  
  // Simple pattern matching for demo
  let taskType: ParsedTask['task_type'] = 'one-time';
  let reminderTimes: string[] = [];
  
  if (lowerInput.includes('daily') || lowerInput.includes('every day')) {
    taskType = 'recurring';
  } else if (lowerInput.includes('meeting')) {
    taskType = 'meeting';
  } else if (lowerInput.includes('till') || lowerInput.includes('deadline') || lowerInput.includes('by')) {
    taskType = 'deadline';
  }
  
  // Extract times
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi;
  const times = input.match(timePattern);
  if (times) {
    reminderTimes = times.map(t => t.trim());
  } else {
    reminderTimes = ['9:00 AM'];
  }
  
  // Extract dates
  const datePattern = /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)/gi;
  const dates = input.match(datePattern);
  
  return {
    task_title: input.split(/(?:notify|remind|at \d)/i)[0].trim() || input,
    task_type: taskType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: dates ? dates[0] : undefined,
    reminder_times: reminderTimes,
    repeat_rule: taskType === 'recurring' ? 'daily' : undefined,
  };
};

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Abu central video need ready',
    taskType: 'deadline',
    startDate: '2025-01-18',
    endDate: '2025-01-20',
    reminderTimes: ['8:00 AM', '2:00 PM', '6:00 PM'],
    repeatRule: 'daily',
    status: 'active',
    createdAt: '2025-01-17T10:00:00Z',
    nextReminder: 'Today, 2:00 PM',
  },
  {
    id: '2',
    title: 'Meeting with Arvind ji',
    taskType: 'meeting',
    startDate: '2025-01-18',
    reminderTimes: ['4:30 PM'],
    status: 'active',
    createdAt: '2025-01-17T09:00:00Z',
    nextReminder: 'Today, 4:30 PM',
  },
  {
    id: '3',
    title: 'Submit quarterly report',
    taskType: 'deadline',
    endDate: '2025-01-22',
    reminderTimes: ['9:00 AM'],
    status: 'active',
    createdAt: '2025-01-16T14:00:00Z',
    nextReminder: 'Tomorrow, 9:00 AM',
  },
];

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);

  const parseTask = useCallback(async (input: string): Promise<ParsedTask> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const parsed = mockParseTask(input);
    setIsLoading(false);
    return parsed;
  }, []);

  const addTask = useCallback((parsedTask: ParsedTask) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: parsedTask.task_title,
      taskType: parsedTask.task_type,
      startDate: parsedTask.start_date,
      endDate: parsedTask.end_date,
      reminderTimes: parsedTask.reminder_times,
      repeatRule: parsedTask.repeat_rule,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextReminder: `Today, ${parsedTask.reminder_times[0] || '9:00 AM'}`,
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'completed' as const } : task
    ));
  }, []);

  const snoozeTask = useCallback((taskId: string, minutes: number) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
        const hours = snoozeTime.getHours();
        const mins = snoozeTime.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return {
          ...task,
          status: 'snoozed' as const,
          nextReminder: `Today, ${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`,
        };
      }
      return task;
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  const activeTasks = tasks.filter(t => t.status === 'active' || t.status === 'snoozed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return {
    tasks,
    activeTasks,
    completedTasks,
    isLoading,
    parseTask,
    addTask,
    completeTask,
    snoozeTask,
    deleteTask,
    updateTask,
  };
};
