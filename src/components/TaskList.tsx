import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { CheckCircle2, Inbox } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onTaskClick: (task: Task) => void;
  showCompleted?: boolean;
}

export const TaskList = ({ 
  tasks, 
  onComplete, 
  onSnooze, 
  onTaskClick,
  showCompleted = false 
}: TaskListProps) => {
  const filteredTasks = showCompleted 
    ? tasks.filter(t => t.status === 'completed')
    : tasks.filter(t => t.status !== 'completed');

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          {showCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          ) : (
            <Inbox className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {showCompleted ? 'No completed tasks' : 'No active tasks'}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {showCompleted 
            ? 'Tasks you complete will appear here'
            : 'Type a task below to get started. Try "Meeting tomorrow at 3pm"'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {filteredTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={onComplete}
          onSnooze={onSnooze}
          onClick={onTaskClick}
        />
      ))}
    </div>
  );
};
