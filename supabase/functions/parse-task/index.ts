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

    // Get today's date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const today = istTime.toISOString().split('T')[0];
    const currentHour = istTime.getUTCHours();
    
    // Calculate tomorrow in IST
    const tomorrowIST = new Date(istTime.getTime() + 24 * 60 * 60 * 1000);
    const tomorrow = tomorrowIST.toISOString().split('T')[0];
    
    // Calculate next week
    const nextWeekIST = new Date(istTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeek = nextWeekIST.toISOString().split('T')[0];
    
    console.log("Today (IST):", today, "Tomorrow (IST):", tomorrow, "Current hour:", currentHour);
    
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
            content: `You are a task parsing assistant. Today's date is ${today}, tomorrow is ${tomorrow}, and next week starts ${nextWeek}. Current hour in IST is ${currentHour}:00. All dates are in Indian Standard Time (IST). Extract structured task information from natural language input.

SMART TIME DEFAULTS (use these when specific time not mentioned):
- "morning" → "9:00 AM"
- "afternoon" → "2:00 PM"  
- "evening" → "6:00 PM"
- "night" or "tonight" → "9:00 PM"
- "lunch" or "lunchtime" → "1:00 PM"
- "end of day" or "EOD" → "6:00 PM"
- No time specified → default based on context:
  - For meetings/calls: "10:00 AM"
  - For reminders: "9:00 AM"
  - For deadlines: "6:00 PM" (end of day)

DATE PARSING:
- "today" → ${today}
- "tomorrow" → ${tomorrow}
- "day after tomorrow" → day after ${tomorrow}
- "next week" → ${nextWeek}
- "this weekend" → upcoming Saturday
- "monday", "tuesday", etc. → next occurrence of that day

TASK TYPE DETECTION:
- 'call' for phone calls, calling someone
- 'meeting' for meetings, appointments
- 'deadline' for due dates, submissions, payments
- 'recurring' for daily/weekly/monthly tasks
- 'email' for sending emails
- 'reminder' for general reminders
- 'one-time' for single tasks
- 'location' for location-based reminders (when user mentions "when I reach", "when I visit", "when I arrive at", "at location", etc.)

LOCATION-BASED TASKS:
If user mentions a location trigger like:
- "when I reach [place]"
- "when I visit [place]"
- "when I arrive at [place]"
- "remind me at [place]"
- "notify me when at [place]"
Extract the location_name and set task_type to 'location'. Do NOT set reminder_times for location tasks - they trigger when user arrives at location.

IMPORTANT RULES:
1. Always set start_date when any date reference is found (use today for location tasks if no date)
2. For tasks with dates but no times, use smart defaults above
3. Extract the clean task title without date/time/location trigger words
4. For recurring tasks, set repeat_rule appropriately
5. For location tasks, extract the location name and set is_location_task to true`
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
                    description: "A clean, concise title for the task (without date/time words)"
                  },
                  task_type: {
                    type: "string",
                    enum: ["deadline", "meeting", "one-time", "recurring", "call", "email", "reminder", "location"],
                    description: "The type of task. Use 'location' for location-based reminders (when user mentions arriving at a place)."
                  },
                  start_date: {
                    type: "string",
                    description: "Start date in YYYY-MM-DD format. REQUIRED when any date is mentioned."
                  },
                  end_date: {
                    type: "string",
                    description: "End/due date in YYYY-MM-DD format, or null if not specified"
                  },
                  reminder_times: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of reminder times in format like '9:00 AM', '2:30 PM'. Use smart defaults."
                  },
                  repeat_rule: {
                    type: "string",
                    enum: ["daily", "weekly", "monthly", "none"],
                    description: "Repeat rule for recurring tasks. Use 'none' for no repeat."
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "Priority level. Default to 'medium'. Use 'high' for important/urgent keywords, 'urgent' for ASAP/critical."
                  },
                  is_location_task: {
                    type: "boolean",
                    description: "Set to true if task should trigger when user arrives at a location"
                  },
                  location_name: {
                    type: "string",
                    description: "Name of the location to trigger reminder (e.g., 'Bhagwati Resort', 'Office', 'Mall')"
                  }
                },
                required: ["task_title", "task_type", "start_date"],
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

    // For location tasks, don't require reminder_times (they trigger on arrival)
    if (parsedTask.is_location_task || parsedTask.task_type === 'location') {
      parsedTask.reminder_times = [];
      parsedTask.is_location_task = true;
    } else if (!parsedTask.reminder_times || !Array.isArray(parsedTask.reminder_times)) {
      parsedTask.reminder_times = ["9:00 AM"];
    }

    // Ensure start_date defaults to today if not set
    if (!parsedTask.start_date) {
      parsedTask.start_date = today;
    }

    // Default priority if not set
    if (!parsedTask.priority) {
      parsedTask.priority = "medium";
    }

    // Convert reminder times to ISO format for consistent storage
    const convertedReminderTimes = parsedTask.reminder_times.map((time: string) => {
      // If already ISO format, return as-is
      if (time.includes('T')) {
        return time;
      }
      
      // Parse time like "9:00 AM"
      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) {
        // Default to 9 AM
        const defaultDate = new Date(`${parsedTask.start_date}T09:00:00+05:30`);
        return defaultDate.toISOString();
      }
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const isPM = match[3].toUpperCase() === 'PM';
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      // Create IST date string and convert to UTC
      const hoursStr = hours.toString().padStart(2, '0');
      const minsStr = minutes.toString().padStart(2, '0');
      const istDateStr = `${parsedTask.start_date}T${hoursStr}:${minsStr}:00+05:30`;
      const date = new Date(istDateStr);
      
      return date.toISOString();
    });
    
    parsedTask.reminder_times = convertedReminderTimes;
    console.log("Converted reminder times to ISO:", convertedReminderTimes);

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
