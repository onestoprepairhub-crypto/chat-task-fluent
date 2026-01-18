import { useState } from 'react';
import { X, Trash2, Check, Bell, Calendar, Clock, Save, Repeat, Circle, BellRing, Target, FolderKanban, ShoppingBag, Phone, Mail, CreditCard, Heart, Dumbbell, GraduationCap, Flame, Flag, Timer, MapPin, Map } from 'lucide-react';
import { Task, TASK_TYPES, REPEAT_RULES, PRIORITY_LEVELS, TIME_ESTIMATES, TaskType, RepeatRule, Priority, TaskLocation } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationPicker } from '@/components/LocationPicker';
import { cn } from '@/lib/utils';

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
  const [title, setTitle] = useState(task.title);
  const [endDate, setEndDate] = useState(task.endDate || '');
  const [reminderTimes, setReminderTimes] = useState(task.reminderTimes.join(', '));
  const [taskType, setTaskType] = useState<TaskType>(task.taskType || 'general');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(task.repeatRule || '');
  const [priority, setPriority] = useState<Priority>(task.priority || 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task.estimatedMinutes);
  const [location, setLocation] = useState<TaskLocation | undefined>(task.location);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleLocationChange = (newLocation: TaskLocation | undefined) => {
    setLocation(newLocation);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      endDate: endDate || undefined,
      reminderTimes: reminderTimes.split(',').map(t => t.trim()).filter(Boolean),
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
                Reminder Times (IST)
              </label>
              <Input
                value={reminderTimes}
                onChange={handleChange(setReminderTimes)}
                placeholder="9:00 AM, 2:00 PM"
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Times are in Indian Standard Time (IST). Separate multiple times with commas.
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

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          value={location}
          onChange={handleLocationChange}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
};