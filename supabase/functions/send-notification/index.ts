import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  taskId: string;
  title: string;
  body: string;
  fcmToken: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIREBASE_SERVER_KEY = Deno.env.get("FIREBASE_SERVER_KEY");
    const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
    
    if (!FIREBASE_SERVER_KEY || !FIREBASE_PROJECT_ID) {
      console.error("Firebase credentials not configured");
      throw new Error("Firebase not configured");
    }

    const { taskId, title, body, fcmToken } = await req.json() as NotificationPayload;

    if (!fcmToken) {
      return new Response(
        JSON.stringify({ error: "FCM token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending notification for task:", taskId);

    // Firebase Cloud Messaging HTTP v1 API
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          taskId,
          title,
          body,
          click_action: "OPEN_APP",
        },
        webpush: {
          notification: {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            requireInteraction: true,
            actions: [
              { action: "complete", title: "✅ Complete" },
              { action: "snooze", title: "⏰ Snooze" },
              { action: "reschedule", title: "📅 Reschedule" },
            ],
          },
          fcm_options: {
            link: `/?task=${taskId}`,
          },
        },
        android: {
          notification: {
            icon: "notification_icon",
            click_action: "OPEN_APP",
          },
        },
      },
    };

    // Use legacy API for simplicity (works with server key)
    const legacyMessage = {
      to: fcmToken,
      notification: {
        title,
        body,
        icon: "/favicon.ico",
        click_action: "/",
      },
      data: {
        taskId,
        title,
        body,
      },
      webpush: {
        notification: {
          requireInteraction: true,
        },
      },
    };

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(legacyMessage),
    });

    const result = await response.json();
    console.log("FCM response:", result);

    if (!response.ok || result.failure > 0) {
      console.error("FCM error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.results?.[0]?.message_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
