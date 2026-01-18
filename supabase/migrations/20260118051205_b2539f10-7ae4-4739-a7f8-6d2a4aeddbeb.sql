-- Add push_subscription column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_settings.push_subscription IS 'Web Push subscription object containing endpoint and keys';