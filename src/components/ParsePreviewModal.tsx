import { ParsedTask } from '@/hooks/useTasks';
import { X, Calendar, Clock, Bell, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsePreviewModalProps {
  parsedTask: ParsedTask;
  originalInput: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Format ISO UTC time to IST display
const formatReminderIST = (isoString: string): string => {
  // Check if it's an ISO string
  if (!isoString.includes('T')) {
    return isoString; // Return as-is if not ISO format
  }
  
  const utcDate = new Date(isoString);
  if (isNaN(utcDate.getTime())) {
    return isoString;
  }
  
  // Format in IST timezone
  return utcDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const ParsePreviewModal = ({
  parsedTask,
  originalInput,
  onConfirm,
  onCancel,
}: ParsePreviewModalProps) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deadline': return 'Deadline Task';
      case 'meeting': return 'Meeting';
      case 'recurring': return 'Recurring Task';
      case 'call': return 'Call';
      case 'email': return 'Email';
      case 'reminder': return 'Reminder';
      case 'location': return 'Location Reminder';
      default: return 'One-time Task';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'recurring': return <RefreshCw className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const isLocationTask = parsedTask.is_location_task || parsedTask.task_type === 'location';

  // Format reminders for display in IST
  const formattedReminders = parsedTask.reminder_times.map(formatReminderIST);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg mx-4 mb-4 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Confirm Task</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Original input */}
          <div className="p-3 bg-secondary/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">You said:</p>
            <p className="text-sm text-foreground">{originalInput}</p>
          </div>

          {/* Parsed details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Task Title</p>
              <p className="font-medium text-foreground">{parsedTask.task_title}</p>
            </div>

            <div className="flex items-center gap-2">
              {getTypeIcon(parsedTask.task_type)}
              <span className="text-sm text-foreground">{getTypeLabel(parsedTask.task_type)}</span>
            </div>

            {parsedTask.start_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Date: {new Date(parsedTask.start_date + 'T00:00:00').toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                })}</span>
              </div>
            )}

            {parsedTask.end_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Due: {new Date(parsedTask.end_date + 'T00:00:00').toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  timeZone: 'Asia/Kolkata'
                })}</span>
              </div>
            )}

            {isLocationTask && parsedTask.location_name && (
              <div className="flex items-center gap-2 text-sm bg-primary/10 p-3 rounded-xl">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-medium text-foreground">Location Trigger:</span>
                  <p className="text-muted-foreground">{parsedTask.location_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll need to set the exact location on the map after adding this task.
                  </p>
                </div>
              </div>
            )}

            {!isLocationTask && formattedReminders.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Reminders (IST):</span>
                  <div className="mt-1 space-y-1">
                    {formattedReminders.map((reminder, idx) => (
                      <div key={idx} className="text-foreground">{reminder}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {parsedTask.repeat_rule && parsedTask.repeat_rule !== 'none' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                <span>Repeats: {parsedTask.repeat_rule}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
};
