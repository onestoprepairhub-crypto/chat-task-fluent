import { useState, useRef } from 'react';
import { Bell, Calendar, Check, Clock, ChevronRight, Repeat, Circle, BellRing, Target, FolderKanban, ShoppingBag, Phone, Mail, CreditCard, Heart, Dumbbell, GraduationCap, Flame } from 'lucide-react';
import { Task, TaskType } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onClick: (task: Task) => void;
}

const getTypeIcon = (taskType: TaskType) => {
  const iconClass = "w-4 h-4";
  switch (taskType) {
    case 'meeting':
      return <Calendar className={iconClass} />;
    case 'deadline':
      return <Clock className={iconClass} />;
    case 'recurring':
      return <Repeat className={iconClass} />;
    case 'reminder':
      return <BellRing className={iconClass} />;
    case 'habit':
      return <Flame className={iconClass} />;
    case 'goal':
      return <Target className={iconClass} />;
    case 'project':
      return <FolderKanban className={iconClass} />;
    case 'errand':
      return <ShoppingBag className={iconClass} />;
    case 'call':
      return <Phone className={iconClass} />;
    case 'email':
      return <Mail className={iconClass} />;
    case 'payment':
      return <CreditCard className={iconClass} />;
    case 'health':
      return <Heart className={iconClass} />;
    case 'exercise':
      return <Dumbbell className={iconClass} />;
    case 'study':
      return <GraduationCap className={iconClass} />;
    case 'one-time':
      return <Bell className={iconClass} />;
    case 'general':
    default:
      return <Circle className={iconClass} />;
  }
};

export const TaskCard = ({ task, onComplete, onSnooze, onClick }: TaskCardProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Limit swipe range
    const clampedDiff = Math.max(-120, Math.min(120, diff));
    setSwipeX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (swipeX > threshold) {
      onComplete(task.id);
    } else if (swipeX < -threshold) {
      onSnooze(task.id);
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  const getStatusBadge = () => {
    if (task.status === 'completed') {
      return <span className="status-badge status-completed">Completed</span>;
    }
    if (task.status === 'snoozed') {
      return <span className="status-badge bg-warning/15 text-warning">Snoozed</span>;
    }
    return <span className="status-badge status-active">Active</span>;
  };

  const getTypeBadge = () => {
    const typeLabel = task.taskType?.replace('-', ' ') || 'general';
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
        {typeLabel}
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe backgrounds */}
      <div className="absolute inset-0 flex">
        <div className={cn(
          "w-1/2 bg-success flex items-center justify-start pl-4 transition-opacity",
          swipeX > 20 ? "opacity-100" : "opacity-0"
        )}>
          <Check className="w-6 h-6 text-success-foreground" />
        </div>
        <div className={cn(
          "w-1/2 bg-warning flex items-center justify-end pr-4 transition-opacity",
          swipeX < -20 ? "opacity-100" : "opacity-0"
        )}>
          <Clock className="w-6 h-6 text-warning-foreground" />
        </div>
      </div>

      {/* Card content */}
      <div
        className={cn(
          "task-card relative z-10 touch-action-pan-y",
          task.status === 'completed' && "opacity-60"
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !isSwiping && swipeX === 0 && onClick(task)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-muted-foreground">{getTypeIcon(task.taskType)}</span>
              {getTypeBadge()}
              {getStatusBadge()}
              {task.repeatRule && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Repeat className="w-3 h-3" />
                  {task.repeatRule}
                </span>
              )}
            </div>
            <h3 className={cn(
              "font-medium text-foreground line-clamp-2",
              task.status === 'completed' && "line-through"
            )}>
              {task.title}
            </h3>
            {task.nextReminder && task.status !== 'completed' && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {task.nextReminder}
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
};