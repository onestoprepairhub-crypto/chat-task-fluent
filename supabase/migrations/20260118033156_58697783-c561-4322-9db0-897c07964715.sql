-- Add new columns to tasks table for priority, time estimation, and location
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_minutes integer,
ADD COLUMN IF NOT EXISTS location_name text,
ADD COLUMN IF NOT EXISTS location_lat numeric,
ADD COLUMN IF NOT EXISTS location_lng numeric,
ADD COLUMN IF NOT EXISTS location_radius integer DEFAULT 100;