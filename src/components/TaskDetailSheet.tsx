import { useState, useMemo, lazy, Suspense } from 'react';
import { X, Trash2, Check, Bell, Calendar, Clock, Save, Repeat, Circle, BellRing, Target, FolderKanban, ShoppingBag, Phone, Mail, CreditCard, Heart, Dumbbell, GraduationCap, Flame, Flag, Timer, MapPin, Map, Plus, Loader2 } from 'lucide-react';
import { Task, TASK_TYPES, REPEAT_RULES, PRIORITY_LEVELS, TIME_ESTIMATES, TaskType, RepeatRule, Priority, TaskLocation } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Lazy load LocationPicker to prevent Google Maps from affecting mobile rendering
const LocationPicker = lazy(() => import('@/components/LocationPicker'));

interface ReminderDateTime {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hour format for input)
}

// IST is UTC+5:30
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Get current date in IST as YYYY-MM-DD
function getTodayIST(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60000);
  return istTime.toISOString().split('T')[0];
}

// Parse reminder string like "9:00 AM" or "2025-01-18T09:00:00" into ReminderDateTime (IST)
function parseReminderToDateTime(reminder: string, defaultDate: string): ReminderDateTime {
  try {
    // Check if it's an ISO string (stored as UTC)
    if (reminder && (reminder.includes('T') || reminder.match(/^\d{4}-\d{2}-\d{2}/))) {
      const utcDate = new Date(reminder);
      if (!isNaN(utcDate.getTime())) {
        // Format using IST timezone
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        };
        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(utcDate);
        
        const year = parts.find(p => p.type === 'year')?.value || '2026';
        const month = parts.find(p => p.type === 'month')?.value || '01';
        const day = parts.find(p => p.type === 'day')?.value || '01';
        const hour = parts.find(p => p.type === 'hour')?.value || '09';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        
        return {
          date: `${year}-${month}-${day}`,
          time: `${hour}:${minute}`,
        };
      }
    }
    
    // Parse time like "9:00 AM" or "2:30 PM"
    if (reminder) {
      const match = reminder.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3]?.toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return {
          date: defaultDate || getTodayIST(),
          time: `${hours.toString().padStart(2, '0')}:${minutes}`,
        };
      }
    }
  } catch (error) {
    console.error('Error parsing reminder:', reminder, error);
  }
  
  // Default to 9 AM on the given date
  return {
    date: defaultDate || getTodayIST(),
    time: '09:00',
  };
}

// Format ReminderDateTime (IST) to ISO string (UTC) for storage
function formatReminderDateTime(reminder: ReminderDateTime): string {
  // Parse the IST date and time
  const [year, month, day] = reminder.date.split('-').map(Number);
  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  // Create a date in IST (as if it's UTC)
  const istAsUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Subtract IST offset to get actual UTC time
  const utcTime = new Date(istAsUtc.getTime() - IST_OFFSET_MS);
  
  return utcTime.toISOString();
}

interface TaskDetailSheetProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Circle: <Circle className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />,
  Repeat: <Repeat className="w-4 h-4" />,
  BellRing: <BellRing className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  FolderKanban: <FolderKanban className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
  Mail: <Mail className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Dumbbell: <Dumbbell className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
};

export const TaskDetailSheet = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
}: TaskDetailSheetProps) => {
  // Safe initialization with fallbacks
  const safeTask = {
    ...task,
    title: task?.title || '',
    taskType: task?.taskType || 'general',
    repeatRule: task?.repeatRule || '',
    priority: task?.priority || 'medium',
    reminderTimes: Array.isArray(task?.reminderTimes) ? task.reminderTimes : [],
    startDate: task?.startDate || '',
    endDate: task?.endDate || '',
  };

  const [title, setTitle] = useState(safeTask.title);
  const [startDate, setStartDate] = useState(safeTask.startDate);
  const [endDate, setEndDate] = useState(safeTask.endDate);
  const [taskType, setTaskType] = useState<TaskType>(safeTask.taskType as TaskType);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(safeTask.repeatRule as RepeatRule);
  const [priority, setPriority] = useState<Priority>(safeTask.priority as Priority);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimatedMinutes);
  const [location, setLocation] = useState<TaskLocation | undefined>(task?.location);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse existing reminder times into structured format with safe defaults
  const defaultDate = startDate || endDate || getTodayIST();
  const [reminders, setReminders] = useState<ReminderDateTime[]>(() => {
    try {
      if (!safeTask.reminderTimes || safeTask.reminderTimes.length === 0) {
        return [{ date: defaultDate, time: '09:00' }];
      }
      return safeTask.reminderTimes.map(r => parseReminderToDateTime(r, defaultDate));
    } catch (error) {
      console.error('Error initializing reminders:', error);
      return [{ date: defaultDate, time: '09:00' }];
    }
  });

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleLocationChange = (newLocation: TaskLocation | undefined) => {
    setLocation(newLocation);
    setHasChanges(true);
  };

  const handleReminderChange = (index: number, field: 'date' | 'time', value: string) => {
    setReminders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const addReminder = () => {
    const newDate = startDate || endDate || getTodayIST();
    setReminders(prev => [...prev, { date: newDate, time: '09:00' }]);
    setHasChanges(true);
  };

  const removeReminder = (index: number) => {
    if (reminders.length > 1) {
      setReminders(prev => prev.filter((_, i) => i !== index));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    // Convert structured reminders to ISO strings for storage
    const reminderTimesISO = reminders.map(r => formatReminderDateTime(r));
    
    onUpdate(task.id, {
      title,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      reminderTimes: reminderTimesISO,
      taskType,
      repeatRule: repeatRule || undefined,
      priority,
      estimatedMinutes,
      location,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-card w-full max-w-lg mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
            {/* Title */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Task Title
              </label>
              <Input
                value={title}
                onChange={handleChange(setTitle)}
                className="h-12 rounded-xl text-base"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITY_LEVELS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPriority(p.value);
                      setHasChanges(true);
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                      priority === p.value
                        ? `${p.bg} ${p.color} ring-2 ring-offset-2 ring-offset-background`
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      priority === p.value && p.value === 'low' && "ring-muted-foreground",
                      priority === p.value && p.value === 'medium' && "ring-primary",
                      priority === p.value && p.value === 'high' && "ring-warning",
                      priority === p.value && p.value === 'urgent' && "ring-destructive"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Estimation */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Time Estimate
              </label>
              <div className="flex gap-2 flex-wrap">
                {TIME_ESTIMATES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setEstimatedMinutes(estimatedMinutes === t.value ? undefined : t.value);
                      setHasChanges(true);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      estimatedMinutes === t.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Task Type
              </label>
              <Select
                value={taskType}
                onValueChange={(value: TaskType) => {
                  setTaskType(value);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {iconMap[type.icon]}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Repeat Rule */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Repeat
              </label>
              <Select
                value={repeatRule}
                onValueChange={(value: RepeatRule) => {
                  setRepeatRule(value);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0">
                  <SelectValue placeholder="Select repeat frequency" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  {REPEAT_RULES.map((rule) => (
                    <SelectItem key={rule.value || 'none'} value={rule.value}>
                      {rule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHasChanges(true);
                }}
                className="h-12 rounded-xl"
              />
            </div>

            {/* End Date / Due Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={handleChange(setEndDate)}
                className="h-12 rounded-xl"
              />
            </div>

            {/* Reminder Date & Time */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminders (IST)
              </label>
              <div className="space-y-3">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={reminder.date}
                      onChange={(e) => handleReminderChange(index, 'date', e.target.value)}
                      className="h-12 rounded-xl flex-1"
                    />
                    <Input
                      type="time"
                      value={reminder.time}
                      onChange={(e) => handleReminderChange(index, 'time', e.target.value)}
                      className="h-12 rounded-xl w-32"
                    />
                    {reminders.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReminder(index)}
                        className="h-10 w-10 text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminder}
                  className="w-full rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Reminder
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Set exact date & time for each reminder. All times are in IST.
              </p>
            </div>

            {/* Location Reminder with Google Maps */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Reminder
              </label>
              
              {location ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Notify within {location.radius}m
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocationPicker(true)}
                      className="text-primary"
                    >
                      Edit
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLocationChange(undefined)}
                    className="w-full rounded-xl text-destructive border-destructive"
                  >
                    Remove Location
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full h-12 rounded-xl"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Add Location with Map
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                You'll be automatically notified when you reach this location.
              </p>
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="p-4 border-t border-border bg-card space-y-3">
            {hasChanges && (
              <Button
                onClick={handleSave}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}

            {task.status !== 'completed' && (
              <Button
                onClick={() => {
                  onComplete(task.id);
                  onClose();
                }}
                variant="outline"
                className="w-full h-12 rounded-xl border-success text-success hover:bg-success/10"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}

            <Button
              onClick={handleDelete}
              variant="outline"
              className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>

      {/* Location Picker Modal - Lazy loaded */}
      {showLocationPicker && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl p-6 shadow-xl border border-border">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2 text-center">Loading map...</p>
            </div>
          </div>
        }>
          <LocationPicker
            value={location}
            onChange={handleLocationChange}
            onClose={() => setShowLocationPicker(false)}
          />
        </Suspense>
      )}
    </>
  );
};