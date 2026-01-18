-- Drop the existing task_type check constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Add a new check constraint that includes 'location' type
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check 
CHECK (task_type IN ('general', 'deadline', 'meeting', 'one-time', 'recurring', 'reminder', 'location', 'habit', 'goal', 'project', 'errand', 'call', 'email', 'payment', 'health', 'exercise', 'study'));