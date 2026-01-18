import { ParsedTask } from '@/types/task';
import { X, Calendar, Clock, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsePreviewModalProps {
  parsedTask: ParsedTask;
  originalInput: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ParsePreviewModal = ({
  parsedTask,
  originalInput,
  onConfirm,
  onCancel,
}: ParsePreviewModalProps) => {
  const getTypeLabel = (type: ParsedTask['task_type']) => {
    switch (type) {
      case 'deadline': return 'Deadline Task';
      case 'meeting': return 'Meeting';
      case 'recurring': return 'Recurring Task';
      default: return 'One-time Task';
    }
  };

  const getTypeIcon = (type: ParsedTask['task_type']) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'recurring': return <RefreshCw className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

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

            {parsedTask.end_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Due: {parsedTask.end_date}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span>Reminders: {parsedTask.reminder_times.join(', ')}</span>
            </div>

            {parsedTask.repeat_rule && (
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
