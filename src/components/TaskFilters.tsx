import { useState } from 'react';
import { Search, Filter, X, Flag, Clock, MapPin } from 'lucide-react';
import { TASK_TYPES, PRIORITY_LEVELS, TaskType, Priority } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface TaskFiltersState {
  searchQuery: string;
  priorities: Priority[];
  taskTypes: TaskType[];
  hasLocation: boolean | null;
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
}

export const TaskFilters = ({ filters, onFiltersChange }: TaskFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<TaskFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const togglePriority = (priority: Priority) => {
    const current = filters.priorities;
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    updateFilters({ priorities: updated });
  };

  const toggleTaskType = (type: TaskType) => {
    const current = filters.taskTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilters({ taskTypes: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      priorities: [],
      taskTypes: [],
      hasLocation: null,
    });
  };

  const hasActiveFilters = 
    filters.searchQuery || 
    filters.priorities.length > 0 || 
    filters.taskTypes.length > 0 || 
    filters.hasLocation !== null;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            placeholder="Search tasks..."
            className="pl-10 h-11 rounded-xl bg-secondary border-0"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilters({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-11 w-11 rounded-xl",
            isExpanded && "bg-primary text-primary-foreground"
          )}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="glass-card p-4 space-y-4 animate-slide-down">
          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_LEVELS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => togglePriority(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filters.priorities.includes(p.value)
                      ? `${p.bg} ${p.color} ring-2 ring-offset-1`
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Type Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Task Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.slice(0, 8).map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleTaskType(t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filters.taskTypes.includes(t.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilters({ hasLocation: filters.hasLocation === true ? null : true })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  filters.hasLocation === true
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                With Location
              </button>
              <button
                onClick={() => updateFilters({ hasLocation: filters.hasLocation === false ? null : false })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  filters.hasLocation === false
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Without Location
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filters:</span>
          {filters.priorities.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary">
              {filters.priorities.length} priority
            </span>
          )}
          {filters.taskTypes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary">
              {filters.taskTypes.length} types
            </span>
          )}
          {filters.hasLocation !== null && (
            <span className="px-2 py-0.5 rounded-full bg-secondary">
              location
            </span>
          )}
          <button onClick={clearFilters} className="text-destructive hover:underline">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export const filterTasks = (tasks: any[], filters: TaskFiltersState) => {
  return tasks.filter(task => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesLocation = task.location?.name?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesLocation) return false;
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      if (!filters.priorities.includes(task.priority)) return false;
    }

    // Task type filter
    if (filters.taskTypes.length > 0) {
      if (!filters.taskTypes.includes(task.taskType)) return false;
    }

    // Location filter
    if (filters.hasLocation === true && !task.location) return false;
    if (filters.hasLocation === false && task.location) return false;

    return true;
  });
};