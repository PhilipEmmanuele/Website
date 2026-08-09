const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function resolveOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin") || "";
  if (requestOrigin === env.ALLOWED_ORIGIN || LOCAL_ORIGIN_RE.test(requestOrigin)) {
    return requestOrigin;
  }
  return env.ALLOWED_ORIGIN;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = resolveOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid request body" }, 400, origin);
    }

    // Honeypot: a hidden form field real visitors never fill in.
    if (body.company) {
      return json({ ok: true }, 200, origin);
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email)) {
      return json({ ok: false, error: "Invalid email address" }, 400, origin);
    }

    const resendRes = await fetch(
      `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    if (resendRes.ok) {
      return json({ ok: true }, 200, origin);
    }

    // Resend treats re-adding an existing contact as a normal upsert (200/201),
    // so a non-ok response here is a real failure, not a "already subscribed" case.
    const errBody = await resendRes.text();
    console.error("Resend error", resendRes.status, errBody);
    return json({ ok: false, error: "Could not subscribe right now" }, 502, origin);
  },
};
