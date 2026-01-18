import { useState } from 'react';
import { useTasks, ParsedTask, Task } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useLocationReminder } from '@/hooks/useLocationReminder';
import { TaskInput } from '@/components/TaskInput';
import { TaskList } from '@/components/TaskList';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { ParsePreviewModal } from '@/components/ParsePreviewModal';
import { SnoozeModal } from '@/components/SnoozeModal';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { SettingsView } from '@/components/SettingsView';
import { TaskFilters, TaskFiltersState, filterTasks } from '@/components/TaskFilters';
import { CalendarView } from '@/components/CalendarView';
import { Loader2, Calendar } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, isLoading: authLoading, signOut, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [pendingParse, setPendingParse] = useState<{
    input: string;
    parsed: ParsedTask;
  } | null>(null);
  const [snoozeTaskId, setSnoozeTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersState>({
    searchQuery: '',
    priorities: [],
    taskTypes: [],
    hasLocation: null,
  });

  const {
    tasks,
    activeTasks,
    completedTasks,
    isLoading,
    isFetching,
    parseTask,
    addTask,
    completeTask,
    snoozeTask,
    deleteTask,
    updateTask,
  } = useTasks();

  // Set up notification scheduler
  useNotificationScheduler({
    tasks: activeTasks,
    onComplete: completeTask,
    onSnooze: snoozeTask,
  });

  // Set up location-based reminders
  useLocationReminder({ tasks: activeTasks });

  // Redirect to auth if not logged in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleTaskSubmit = async (input: string) => {
    try {
      const parsed = await parseTask(input);
      setPendingParse({ input, parsed });
    } catch {
      // Error already handled in useTasks
    }
  };

  const handleConfirmTask = () => {
    if (pendingParse) {
      addTask(pendingParse.parsed);
      setPendingParse(null);
    }
  };

  const handleSnoozeSelect = (minutes: number) => {
    if (snoozeTaskId) {
      snoozeTask(snoozeTaskId, minutes);
      setSnoozeTaskId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Apply filters to tasks
  const filteredActiveTasks = filterTasks(activeTasks, filters);
  const filteredCompletedTasks = filterTasks(completedTasks, filters);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <Header
              title={getGreeting()}
              subtitle={`${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`}
            />
            <div className="px-4 space-y-4">
              {/* Search/Filter and Calendar Toggle */}
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <TaskFilters filters={filters} onFiltersChange={setFilters} />
                </div>
                <Button
                  variant={showCalendar ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="h-11 w-11 rounded-xl flex-shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              {isFetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : showCalendar ? (
                <CalendarView
                  tasks={tasks}
                  onTaskClick={setSelectedTask}
                />
              ) : (
                <>
                  {filteredActiveTasks.length !== activeTasks.length && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredActiveTasks.length} of {activeTasks.length} tasks
                    </p>
                  )}
                  <TaskList
                    tasks={filteredActiveTasks}
                    onComplete={completeTask}
                    onSnooze={(id) => setSnoozeTaskId(id)}
                    onTaskClick={setSelectedTask}
                  />
                </>
              )}
            </div>
            <TaskInput onSubmit={handleTaskSubmit} isLoading={isLoading} />
          </>
        );
      case 'completed':
        return (
          <>
            <Header title="Completed" subtitle="Tasks you've finished" />
            <div className="px-4 pb-24 space-y-4">
              <TaskFilters filters={filters} onFiltersChange={setFilters} />
              
              {isFetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {filteredCompletedTasks.length !== completedTasks.length && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredCompletedTasks.length} of {completedTasks.length} tasks
                    </p>
                  )}
                  <TaskList
                    tasks={filteredCompletedTasks}
                    onComplete={completeTask}
                    onSnooze={(id) => setSnoozeTaskId(id)}
                    onTaskClick={setSelectedTask}
                    showCompleted
                  />
                </>
              )}
            </div>
          </>
        );
      case 'settings':
        return <SettingsView onSignOut={signOut} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-20">
        {renderContent()}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      {pendingParse && (
        <ParsePreviewModal
          parsedTask={pendingParse.parsed}
          originalInput={pendingParse.input}
          onConfirm={handleConfirmTask}
          onCancel={() => setPendingParse(null)}
        />
      )}

      {snoozeTaskId && (
        <SnoozeModal
          onSelect={handleSnoozeSelect}
          onClose={() => setSnoozeTaskId(null)}
        />
      )}

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onComplete={completeTask}
        />
      )}
    </div>
  );
};

export default Index;