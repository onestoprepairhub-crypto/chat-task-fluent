import { useState } from 'react';
import { Task } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { BulkActionsBar } from './BulkActionsBar';
import { CheckCircle2, Inbox, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onBulkComplete?: (ids: string[]) => void;
  onBulkSnooze?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  showCompleted?: boolean;
}

export const TaskList = ({ 
  tasks, 
  onComplete, 
  onSnooze, 
  onTaskClick,
  onBulkComplete,
  onBulkSnooze,
  onBulkDelete,
  showCompleted = false 
}: TaskListProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const filteredTasks = showCompleted 
    ? tasks.filter(t => t.status === 'completed')
    : tasks.filter(t => t.status !== 'completed');

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    
    // Enable selection mode when first item is selected
    if (newSelected.size > 0 && !selectionMode) {
      setSelectionMode(true);
    }
    // Disable selection mode when no items selected
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkComplete = () => {
    if (onBulkComplete) {
      onBulkComplete(Array.from(selectedIds));
    } else {
      selectedIds.forEach(id => onComplete(id));
    }
    clearSelection();
  };

  const handleBulkSnooze = () => {
    if (onBulkSnooze) {
      onBulkSnooze(Array.from(selectedIds));
    } else {
      selectedIds.forEach(id => onSnooze(id));
    }
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
    }
    clearSelection();
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      clearSelection();
    } else {
      setSelectionMode(true);
    }
  };

  const selectAll = () => {
    const allIds = new Set(filteredTasks.map(t => t.id));
    setSelectedIds(allIds);
    setSelectionMode(true);
  };

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
    <>
      {/* Selection toggle button */}
      {filteredTasks.length > 1 && (
        <div className="flex justify-end mb-2 gap-2">
          {selectionMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs h-8 rounded-lg"
            >
              Select All
            </Button>
          )}
          <Button
            variant={selectionMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleSelectionMode}
            className="text-xs h-8 rounded-lg gap-1"
          >
            <ListChecks className="w-4 h-4" />
            {selectionMode ? 'Cancel' : 'Select'}
          </Button>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onSnooze={onSnooze}
            onClick={onTaskClick}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(task.id)}
            onSelectToggle={handleSelectToggle}
          />
        ))}
      </div>

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onComplete={handleBulkComplete}
        onSnooze={handleBulkSnooze}
        onDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />
    </>
  );
};
