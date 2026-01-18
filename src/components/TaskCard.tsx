import { useState, useRef } from 'react';
import { Bell, Calendar, Check, Clock, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onClick: (task: Task) => void;
}

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

  const getTypeIcon = () => {
    switch (task.taskType) {
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted-foreground">{getTypeIcon()}</span>
              {getStatusBadge()}
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
