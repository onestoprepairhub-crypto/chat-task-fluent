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

export interface SnoozeOption {
  label: string;
  minutes: number;
}
