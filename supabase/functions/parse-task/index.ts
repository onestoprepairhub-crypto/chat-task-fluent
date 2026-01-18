import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { input } = await req.json();
    
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: "Input is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Parsing task input:", input);

    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a task parsing assistant. Today's date is ${today}. Extract structured task information from natural language input. Be smart about interpreting dates, times, and task types.

When parsing:
- "tomorrow" means the day after today
- "next week" means 7 days from today  
- Times like "8am" should be formatted as "8:00 AM"
- If no specific time is mentioned, default to "9:00 AM"
- If user mentions multiple reminder times, extract all of them
- Detect task type: 'meeting' for meetings/calls, 'deadline' for due dates, 'recurring' for daily/weekly tasks, 'one-time' for single reminders
- For recurring tasks, extract the repeat_rule (daily, weekly, monthly)`
          },
          {
            role: "user",
            content: input
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_task",
              description: "Extract structured task data from natural language",
              parameters: {
                type: "object",
                properties: {
                  task_title: {
                    type: "string",
                    description: "A clean, concise title for the task"
                  },
                  task_type: {
                    type: "string",
                    enum: ["deadline", "meeting", "one-time", "recurring"],
                    description: "The type of task"
                  },
                  start_date: {
                    type: "string",
                    description: "Start date in YYYY-MM-DD format, or null if not specified"
                  },
                  end_date: {
                    type: "string",
                    description: "End/due date in YYYY-MM-DD format, or null if not specified"
                  },
                  reminder_times: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of reminder times in format like '9:00 AM', '2:30 PM'"
                  },
                  repeat_rule: {
                    type: "string",
                    enum: ["daily", "weekly", "monthly", null],
                    description: "Repeat rule for recurring tasks"
                  }
                },
                required: ["task_title", "task_type", "reminder_times"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_task" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to parse task");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_task") {
      throw new Error("Invalid AI response format");
    }

    const parsedTask = JSON.parse(toolCall.function.arguments);
    console.log("Parsed task:", parsedTask);

    // Ensure reminder_times is always an array
    if (!parsedTask.reminder_times || !Array.isArray(parsedTask.reminder_times)) {
      parsedTask.reminder_times = ["9:00 AM"];
    }

    return new Response(
      JSON.stringify(parsedTask),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error parsing task:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse task" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
