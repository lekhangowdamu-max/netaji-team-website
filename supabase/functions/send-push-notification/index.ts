import webpush from "npm:web-push@3.6.7"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY")

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return Response.json(
        {
          error:
            "Supabase server configuration is missing.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    // Check the logged-in user
    const supabaseUser = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get("Authorization") ?? "",
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } =
      await supabaseUser.auth.getUser()

    if (userError || !user) {
      return Response.json(
        {
          error:
            "You must be logged in to send notifications.",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    // Use service role only on the server
    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey
      )

    // Check admin role
    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (
      profileError ||
      !profile ||
      profile.role !== "admin"
    ) {
      return Response.json(
        {
          error:
            "Only the admin can send notifications.",
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    // VAPID configuration
    const vapidPublicKey =
      Deno.env.get("VAPID_PUBLIC_KEY")

    const vapidPrivateKey =
      Deno.env.get("VAPID_PRIVATE_KEY")

    if (
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return Response.json(
        {
          error:
            "VAPID keys are not configured.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    webpush.setVapidDetails(
      "mailto:lekhangowdamu@gmail.com",
      vapidPublicKey,
      vapidPrivateKey
    )

    const body = await req.json()

    const title =
      body.title ||
      "ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ"

    const message =
      body.body ||
      "ನಿಮಗೆ ಹೊಸ ಅಪ್‌ಡೇಟ್ ಇದೆ."

    const url =
      body.url || "/"

    // Load all subscriptions
    const {
      data: subscriptions,
      error: subscriptionsError,
    } =
      await supabaseAdmin
        .from("notification_subscriptions")
        .select(
          "id,user_id,endpoint,p256dh,auth"
        )

    if (subscriptionsError) {
      return Response.json(
        {
          error:
            subscriptionsError.message,
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    let sent = 0
    let failed = 0

    for (const subscription of
      subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint:
              subscription.endpoint,
            keys: {
              p256dh:
                subscription.p256dh,
              auth:
                subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body: message,
            url,
          })
        )

        sent++
      } catch (error) {
        console.error(
          "Push notification failed:",
          error
        )

        failed++

        // Remove expired subscriptions
        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await supabaseAdmin
            .from(
              "notification_subscriptions"
            )
            .delete()
            .eq(
              "id",
              subscription.id
            )
        }
      }
    }

    return Response.json(
      {
        success: true,
        message:
          "Push notification process completed.",
        totalSubscriptions:
          subscriptions?.length || 0,
        sent,
        failed,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    )
  } catch (error) {
    console.error(
      "SEND PUSH ERROR:",
      error
    )

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})