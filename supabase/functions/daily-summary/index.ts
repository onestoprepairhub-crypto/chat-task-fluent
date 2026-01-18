import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with daily_summary enabled
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, fcm_token")
      .eq("daily_summary", true)
      .not("fcm_token", "is", null);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} users with daily summary enabled`);

    const results = [];

    for (const setting of settings || []) {
      // Get today's date in IST
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const todayStart = new Date(istTime);
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(istTime);
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Convert back to UTC for database query
      const todayStartUTC = new Date(todayStart.getTime() - istOffset);
      const todayEndUTC = new Date(todayEnd.getTime() - istOffset);

      // Get user's tasks for today
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", setting.user_id)
        .neq("status", "completed")
        .or(`start_date.eq.${istTime.toISOString().split('T')[0]},next_reminder.gte.${todayStartUTC.toISOString()}.and.next_reminder.lte.${todayEndUTC.toISOString()}`);

      if (tasksError) {
        console.error(`Error fetching tasks for user ${setting.user_id}:`, tasksError);
        continue;
      }

      const taskCount = tasks?.length || 0;
      const urgentCount = tasks?.filter(t => t.priority === 'urgent' || t.priority === 'high').length || 0;

      if (taskCount === 0) {
        console.log(`No tasks for user ${setting.user_id}, skipping notification`);
        continue;
      }

      // Build summary message
      let title = `📋 ${taskCount} task${taskCount !== 1 ? 's' : ''} today`;
      let body = tasks!.slice(0, 3).map(t => `• ${t.title}`).join('\n');
      
      if (taskCount > 3) {
        body += `\n... and ${taskCount - 3} more`;
      }
      
      if (urgentCount > 0) {
        title = `🔥 ${urgentCount} urgent + ${taskCount - urgentCount} tasks today`;
      }

      // Send notification using existing send-notification function
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: setting.fcm_token,
            title,
            body,
            data: { type: "daily_summary" },
          }),
        });

        if (response.ok) {
          console.log(`Daily summary sent to user ${setting.user_id}`);
          results.push({ userId: setting.user_id, success: true });
        } else {
          console.error(`Failed to send to user ${setting.user_id}:`, await response.text());
          results.push({ userId: setting.user_id, success: false });
        }
      } catch (notifError) {
        console.error(`Notification error for user ${setting.user_id}:`, notifError);
        results.push({ userId: setting.user_id, success: false });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Daily summary sent to ${results.filter(r => r.success).length} users`,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in daily-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send daily summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
