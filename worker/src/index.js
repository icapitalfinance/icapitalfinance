// iCapital Finance contact form endpoint (Cloudflare Worker).
//
// The form on /contact-us/ POSTs here. The Worker checks the submission and
// emails it to the business through Resend, sent from the business's own
// domain so Microsoft 365 treats it as authenticated mail.
//
// Settings (wrangler.toml [vars]): TO_EMAIL, FROM_EMAIL, ALLOWED_ORIGINS, BCC_EMAIL (optional)
// Secrets (npx wrangler secret put ...): RESEND_API_KEY, TURNSTILE_SECRET (optional)

const SERVICES = ["Residential Loans", "Commercial Loans", "Equipment Finance"];
const LIMITS = { name: 100, email: 200, phone: 40, message: 5000 };
const MIN_FILL_MS = 3000; // a person takes longer than 3 seconds to fill the form

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept", "Access-Control-Max-Age": "86400", Vary: "Origin" }
      : { Vary: "Origin" };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });

    if (request.method === "OPTIONS") return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers: cors });
    if (request.method !== "POST") return reply(405, { ok: false, error: "method" });
    if (!allowed.includes(origin)) return reply(403, { ok: false, error: "origin" });

    let form;
    try {
      form = await request.formData();
    } catch {
      return reply(400, { ok: false, error: "body" });
    }
    const get = (k) => String(form.get(k) || "").trim();

    // Spam traps. Answer "ok" so bots don't learn they were caught.
    if (get("_gotcha")) return reply(200, { ok: true });
    const started = Number(get("_t"));
    if (started && Date.now() - started < MIN_FILL_MS) return reply(200, { ok: true });

    const data = {
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      service: get("service"),
      message: get("message"),
    };
    const fields = [];
    if (!data.name) fields.push("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fields.push("email");
    if (!SERVICES.includes(data.service)) fields.push("service");
    for (const [k, max] of Object.entries(LIMITS)) if (data[k].length > max) fields.push(k);
    if (fields.length) return reply(422, { ok: false, error: "fields", fields });

    if (env.TURNSTILE_SECRET) {
      const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: get("cf-turnstile-response"),
          remoteip: request.headers.get("CF-Connecting-IP") || "",
        }),
      }).then((r) => r.json()).catch(() => ({ success: false }));
      if (!check.success) return reply(403, { ok: false, error: "captcha" });
    }

    // One line per field, no HTML and no links: plain mail is least likely to be filtered.
    const oneLine = (s) => s.replace(/[\r\n]+/g, " ");
    const text = [
      "New enquiry from the website contact form.",
      "",
      "Name: " + oneLine(data.name),
      "Email: " + data.email,
      "Phone: " + (oneLine(data.phone) || "-"),
      "Service Of Interest: " + data.service,
      "",
      "Message:",
      data.message || "-",
      "",
      "Reply to this email to answer " + oneLine(data.name) + " directly.",
    ].join("\n");

    const email = {
      from: "iCapital Finance Website <" + env.FROM_EMAIL + ">",
      to: [env.TO_EMAIL],
      reply_to: data.email,
      subject: "Website enquiry from " + oneLine(data.name).slice(0, 60) + " – " + data.service,
      text,
    };
    if (env.BCC_EMAIL) email.bcc = [env.BCC_EMAIL];

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(email),
    }).catch(() => null);

    if (!sent || !sent.ok) {
      console.error("Resend failed", sent && sent.status, sent && (await sent.text()));
      return reply(502, { ok: false, error: "send" });
    }
    return reply(200, { ok: true });
  },
};
