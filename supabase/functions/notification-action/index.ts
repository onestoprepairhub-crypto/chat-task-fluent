import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { taskId, action, minutes } = await req.json();

    if (!taskId || !action) {
      return new Response(
        JSON.stringify({ error: "taskId and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing notification action: ${action} for task: ${taskId}`);

    switch (action) {
      case "complete": {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("id", taskId);

        if (error) throw error;
        console.log("Task marked as completed");
        break;
      }

      case "snooze": {
        const snoozeDuration = minutes || 30;
        const newReminderTime = new Date(Date.now() + snoozeDuration * 60 * 1000).toISOString();

        const { error } = await supabase
          .from("tasks")
          .update({ 
            status: "snoozed",
            next_reminder: newReminderTime 
          })
          .eq("id", taskId);

        if (error) throw error;
        console.log(`Task snoozed for ${snoozeDuration} minutes`);
        break;
      }

      case "reschedule": {
        // Just acknowledge - the app will handle rescheduling UI
        console.log("Reschedule requested - opening app");
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing notification action:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process action" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
