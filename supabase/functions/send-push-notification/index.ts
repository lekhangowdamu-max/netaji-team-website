import webpush from "npm:web-push@3.6.7"

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
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json(
        {
          error: "VAPID keys are not configured.",
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

    const url = body.url || "/"

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
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

    const response = await fetch(
      `${supabaseUrl}/rest/v1/notification_subscriptions?select=id,user_id,endpoint,p256dh,auth`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Unable to load subscriptions: ${await response.text()}`
      )
    }

    const subscriptions = await response.json()

    let sent = 0
    let failed = 0

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
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

        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await fetch(
            `${supabaseUrl}/rest/v1/notification_subscriptions?id=eq.${subscription.id}`,
            {
              method: "DELETE",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
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
          subscriptions.length,
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