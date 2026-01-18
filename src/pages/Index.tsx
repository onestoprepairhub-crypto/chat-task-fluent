import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskInput } from '@/components/TaskInput';
import { TaskList } from '@/components/TaskList';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { ParsePreviewModal } from '@/components/ParsePreviewModal';
import { SnoozeModal } from '@/components/SnoozeModal';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { SettingsView } from '@/components/SettingsView';
import { ParsedTask, Task } from '@/types/task';

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [pendingParse, setPendingParse] = useState<{
    input: string;
    parsed: ParsedTask;
  } | null>(null);
  const [snoozeTaskId, setSnoozeTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    activeTasks,
    completedTasks,
    isLoading,
    parseTask,
    addTask,
    completeTask,
    snoozeTask,
    deleteTask,
    updateTask,
  } = useTasks();

  const handleTaskSubmit = async (input: string) => {
    const parsed = await parseTask(input);
    setPendingParse({ input, parsed });
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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <Header
              title={getGreeting()}
              subtitle={`${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`}
            />
            <div className="px-4">
              <TaskList
                tasks={activeTasks}
                onComplete={completeTask}
                onSnooze={(id) => setSnoozeTaskId(id)}
                onTaskClick={setSelectedTask}
              />
            </div>
            <TaskInput onSubmit={handleTaskSubmit} isLoading={isLoading} />
          </>
        );
      case 'completed':
        return (
          <>
            <Header title="Completed" subtitle="Tasks you've finished" />
            <div className="px-4 pb-24">
              <TaskList
                tasks={completedTasks}
                onComplete={completeTask}
                onSnooze={(id) => setSnoozeTaskId(id)}
                onTaskClick={setSelectedTask}
                showCompleted
              />
            </div>
          </>
        );
      case 'settings':
        return <SettingsView />;
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
