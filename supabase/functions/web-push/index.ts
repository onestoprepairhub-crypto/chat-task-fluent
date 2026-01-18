import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push library for Deno
// Using web-push compatible format
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  userId?: string;
  taskId: string;
  title: string;
  body: string;
  subscription?: PushSubscription;
}

// Base64URL encoding utilities
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

// JWT creation for VAPID
async function createVapidJwt(endpoint: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: 'mailto:notifications@task-reminder.app'
  };
  
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import the private key for signing
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  
  // Create the key material with proper EC format
  const keyData = new Uint8Array(32 + 65);
  keyData[0] = 0x04; // Uncompressed point indicator would be at start of public key
  
  // For ES256, we need to import as raw key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    createPkcs8Key(privateKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert DER signature to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  const rawSignature = derToRaw(signatureBytes);
  
  return `${unsignedToken}.${base64UrlEncode(rawSignature)}`;
}

// Convert VAPID private key to PKCS8 format
function createPkcs8Key(privateKeyBytes: Uint8Array): ArrayBuffer {
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87,  // SEQUENCE
    0x02, 0x01, 0x00,  // INTEGER 0 (version)
    0x30, 0x13,        // SEQUENCE
    0x06, 0x07,        // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,  // 1.2.840.10045.2.1 (ecPublicKey)
    0x06, 0x08,        // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,  // 1.2.840.10045.3.1.7 (P-256)
    0x04, 0x6d,        // OCTET STRING
    0x30, 0x6b,        // SEQUENCE
    0x02, 0x01, 0x01,  // INTEGER 1
    0x04, 0x20         // OCTET STRING (32 bytes follow)
  ]);
  
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44,        // [1]
    0x03, 0x42, 0x00   // BIT STRING
  ]);
  
  const result = new Uint8Array(pkcs8Header.length + 32 + pkcs8Footer.length + 65);
  result.set(pkcs8Header);
  result.set(privateKeyBytes.slice(0, 32), pkcs8Header.length);
  
  return result.buffer;
}

// Convert DER signature to raw format
function derToRaw(der: Uint8Array): Uint8Array {
  if (der[0] !== 0x30) {
    return der; // Already raw format
  }
  
  let offset = 2;
  const rLength = der[offset + 1];
  offset += 2;
  
  const r = der.slice(offset, offset + rLength);
  offset += rLength;
  
  const sLength = der[offset + 1];
  offset += 2;
  
  const s = der.slice(offset, offset + sLength);
  
  const raw = new Uint8Array(64);
  raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  
  return raw;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured", publicKey: null }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Handle request for public key
    if (body.action === 'getPublicKey') {
      return new Response(
        JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle subscription save
    if (body.action === 'subscribe') {
      const { userId, subscription } = body;
      
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase not configured");
      }
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Store subscription in user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          push_subscription: subscription,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      if (error) {
        console.error("Error saving subscription:", error);
        throw error;
      }
      
      console.log("Subscription saved for user:", userId);
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle push notification
    const { taskId, title, body: notifBody, subscription, userId } = body as NotificationPayload;
    
    let pushSubscription = subscription;
    
    // If no subscription provided, fetch from database
    if (!pushSubscription && userId) {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase not configured");
      }
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('push_subscription')
        .eq('user_id', userId)
        .single();
      
      if (error || !data?.push_subscription) {
        console.error("No subscription found for user:", userId);
        return new Response(
          JSON.stringify({ error: "No subscription found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      pushSubscription = data.push_subscription;
    }
    
    if (!pushSubscription) {
      return new Response(
        JSON.stringify({ error: "Subscription is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending push notification for task:", taskId);
    console.log("Endpoint:", pushSubscription.endpoint);

    // Create notification payload
    const payload = JSON.stringify({
      title,
      body: notifBody,
      taskId,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { taskId, url: `/?task=${taskId}` },
    });

    // For iOS Safari, we use a simpler approach without encryption
    // iOS Safari Web Push uses APNs behind the scenes
    const isApplePush = pushSubscription.endpoint.includes('apple.com') || 
                        pushSubscription.endpoint.includes('push.apple.com');
    
    let response;
    
    if (isApplePush) {
      // Apple Push Notification service (APNs) via Web Push
      console.log("Using Apple Push path");
      
      const jwt = await createVapidJwt(pushSubscription.endpoint, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY);
      
      response = await fetch(pushSubscription.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '86400',
          'Urgency': 'high',
        },
        body: payload,
      });
    } else {
      // Standard Web Push (Chrome, Firefox, etc.)
      console.log("Using standard Web Push path");
      
      response = await fetch(pushSubscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
          'Urgency': 'high',
          'Authorization': `key=${VAPID_PUBLIC_KEY}`,
        },
        body: payload,
      });
    }

    console.log("Push response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Push failed:", response.status, errorText);
      
      // If subscription is invalid, we should clean it up
      if (response.status === 410 || response.status === 404) {
        return new Response(
          JSON.stringify({ error: "Subscription expired or invalid", shouldResubscribe: true }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Push failed: ${response.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in web-push:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
