import { useState } from 'react';
import { X, Trash2, Check, Bell, Calendar, Clock, Save } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskDetailSheetProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export const TaskDetailSheet = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
}: TaskDetailSheetProps) => {
  const [title, setTitle] = useState(task.title);
  const [endDate, setEndDate] = useState(task.endDate || '');
  const [reminderTimes, setReminderTimes] = useState(task.reminderTimes.join(', '));
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      endDate: endDate || undefined,
      reminderTimes: reminderTimes.split(',').map(t => t.trim()).filter(Boolean),
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg mx-4 mb-4 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
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

          {/* End Date */}
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

          {/* Reminder Times */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminder Times
            </label>
            <Input
              value={reminderTimes}
              onChange={handleChange(setReminderTimes)}
              placeholder="9:00 AM, 2:00 PM"
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple times with commas
            </p>
          </div>

          {/* Task Type Badge */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Task Type
            </label>
            <div className="flex items-center gap-2">
              <span className="status-badge status-active capitalize">
                {task.taskType.replace('-', ' ')}
              </span>
              {task.repeatRule && (
                <span className="text-sm text-muted-foreground">
                  Repeats {task.repeatRule}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 space-y-3">
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
  );
};
