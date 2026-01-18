import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, MapPin, Flag } from 'lucide-react';
import { Task, PRIORITY_LEVELS } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      // Check end_date first, then start_date
      const dateStr = task.endDate || task.startDate;
      if (dateStr) {
        const date = new Date(dateStr);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    
    return map;
  }, [tasks]);

  const getTasksForDate = (date: Date): Task[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDate[key] || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'prev' ? -1 : 1), 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const getPriorityColor = (priority: string) => {
    const config = PRIORITY_LEVELS.find(p => p.value === priority);
    return config?.bg || 'bg-muted';
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayTasks = getTasksForDate(date);
            const hasUrgent = dayTasks.some(t => t.priority === 'urgent');
            const hasHigh = dayTasks.some(t => t.priority === 'high');

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all",
                  "hover:bg-secondary/80",
                  isToday(date) && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  isSelected(date) && "bg-primary text-primary-foreground",
                  !isSelected(date) && !isToday(date) && "bg-secondary/50"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isSelected(date) ? "text-primary-foreground" : "text-foreground"
                )}>
                  {date.getDate()}
                </span>
                
                {/* Task indicators */}
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayTasks.slice(0, 3).map((task, i) => (
                      <div
                        key={task.id}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          task.priority === 'urgent' && "bg-destructive",
                          task.priority === 'high' && "bg-warning",
                          task.priority === 'medium' && "bg-primary",
                          task.priority === 'low' && "bg-muted-foreground"
                        )}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-medium text-foreground">
            {selectedDate.toLocaleDateString('en-IN', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tasks scheduled for this date
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors",
                    task.status === 'completed' && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      task.priority === 'urgent' && "bg-destructive",
                      task.priority === 'high' && "bg-warning",
                      task.priority === 'medium' && "bg-primary",
                      task.priority === 'low' && "bg-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-foreground line-clamp-1",
                        task.status === 'completed' && "line-through"
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {task.nextReminder && (
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {task.nextReminder}
                          </span>
                        )}
                        {task.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {task.location.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};