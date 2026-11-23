# Contact form setup (Cloudflare Worker + Resend)

The contact form on `/contact-us/` posts to a small Cloudflare Worker (`worker/src/index.js`). The Worker checks the submission and emails it to `info@icapitalfinance.com.au` through Resend. The email is sent from `website@icapitalfinance.com.au` and signed with the domain's own DKIM key, so Microsoft 365 treats it as authenticated mail. The visitor's address is the Reply-To, so replying goes straight to them.

This replaces the old Elementor Pro form, which sent mail through WordPress on SiteGround. That server no longer exists.

All accounts below belong to the developer. The site owner does not need to do anything.

## Current setup (23 November 2026)

| Piece | Where |
|---|---|
| Worker | `https://icapital-contact.bryanchew1997.workers.dev`, Cloudflare account `bryanchew1997@gmail.com` |
| Turnstile widget | "iCapital contact form", same Cloudflare account, site key `0x4AAAAAAGOw135uEpNlx_Uj` (public) |
| Resend | account `brychews`, domain `icapitalfinance.com.au` verified (Tokyo), API key `icapital-contact` (sending only, this domain only) |
| Secrets in the Worker | `RESEND_API_KEY`, `TURNSTILE_SECRET` (set with `wrangler secret put`, never stored in this repo) |

Until step 5 is done, the form opens the visitor's own email app with the message filled in, so no enquiry is lost in the meantime.

## What the Worker checks

- The request comes from `https://icapitalfinance.com.au` or `https://www.icapitalfinance.com.au`.
- Name is present, Email looks like an email, Service is one of the three dropdown options, and no field is oversized.
- The hidden honeypot field is empty and the form took longer than 3 seconds to fill. Bots that fail either check get a fake "ok" and no email is sent.
- Cloudflare Turnstile, if `TURNSTILE_SECRET` is set. It shows a check box only when Cloudflare is unsure the visitor is human.

## Step 1. Check the mailbox receives mail

Send a test from any Gmail to `info@icapitalfinance.com.au`. If it bounces, finish `EMAIL-FIX.md` first. Nothing reaches the mailbox until its MX record exists.

## Step 2. Resend: verify the domain (about 10 minutes plus DNS time)

1. Sign up at https://resend.com with your own email. Free plan: 3,000 emails a month, 100 a day.
2. **Domains → Add Domain**, enter `icapitalfinance.com.au`, region **Tokyo (ap-northeast-1)** (closest to Australia).
3. Choose **Manual setup** (not "Auto configure", which would give Resend write access to the GoDaddy DNS). Resend lists these 3 records:

   | Type  | Name at GoDaddy     | Value                                   |
   |-------|---------------------|-----------------------------------------|
   | TXT   | `resend._domainkey` | the long `p=MIGfMA0G...IDAQAB` key      |
   | CNAME | `rsend`             | `rsend-apne1.forge.rmta.net`            |
   | CNAME | `send`              | `send.forge.rmta.net`                   |

4. In GoDaddy → `icapitalfinance.com.au` → **DNS** → **Add New Record**, add all 3. Type the Name exactly as above; GoDaddy adds `.icapitalfinance.com.au` itself.
5. Back in Resend, click **I've already added the records**. Status goes from Pending to Verified, usually within an hour.

Done on 23 November 2026: domain added to Resend (Tokyo), the 3 records added at GoDaddy and confirmed live on GoDaddy's nameservers.

These records sit on the `send`, `rsend` and `resend._domainkey` subdomains. The root `MX`, the root `v=spf1 include:spf.protection.outlook.com -all` record, `autodiscover`, `_dmarc` and the website's `A`, `AAAA` and `www` records were checked before and after and did not change.

**Never switch on "Enable receiving" in Resend.** It asks for an `MX` record on `@`, which would send `info@` mail to Resend instead of Microsoft 365.

6. **API Keys → Create API Key**: name `icapital-contact`, permission **Sending access**, domain `icapitalfinance.com.au`. Copy the key (it starts with `re_`). Resend shows it once.

## Step 3. Turnstile: create the spam check (optional, recommended, 3 minutes)

1. In the Cloudflare dashboard (the account that already runs Web Analytics), open **Turnstile → Add widget**.
2. Name `iCapital contact form`, hostnames `icapitalfinance.com.au` and `www.icapitalfinance.com.au`, mode **Managed**.
3. Copy the **Site Key** and the **Secret Key**.

To also test from `localhost`, add `localhost` as a hostname, or use Cloudflare's test site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA`.

## Step 4. Deploy the Worker (5 minutes)

Run these from the `worker` folder. The first command opens a browser to sign in to Cloudflare.

```bash
cd worker
```

```bash
npx wrangler@4 login
```

```bash
npx wrangler@4 deploy
```

The deploy prints the Worker URL, for example `https://icapital-contact.yourname.workers.dev`. Then add the secrets (each command asks you to paste the value):

```bash
npx wrangler@4 secret put RESEND_API_KEY
```

```bash
npx wrangler@4 secret put TURNSTILE_SECRET
```

Skip the second one if you skipped Turnstile.

To get a copy of every enquiry yourself, uncomment `BCC_EMAIL` in `worker/wrangler.toml`, put your address in, and run `npx wrangler@4 deploy` again.

## Step 5. Point the form at the Worker

1. In `src/pages/contact-us.html`, in the `<form>` tag:
   - replace `https://icapital-contact.YOUR-SUBDOMAIN.workers.dev` with the URL from step 4;
   - replace `YOUR_SITE_KEY` with the Turnstile site key (leave it as is if you skipped Turnstile).
2. Run `python3 build.py`.
3. Commit and push. GitHub Pages updates within about a minute.

## Step 6. Test it live

1. Send an enquiry from https://icapitalfinance.com.au/contact-us/. The form should say "Your submission was successful."
2. In Resend → **Emails**, the message should show **Delivered**.
3. Check it arrived in the `info@` inbox. If the first one lands in Junk, mark it **Not junk** once, or add `website@icapitalfinance.com.au` to Safe senders.

## Later

- **See errors:** Cloudflare dashboard → Workers → `icapital-contact` → **Logs**, or run `npm run logs` in `worker/` to watch live. A failed send logs "Resend failed" with Resend's reason, and the visitor sees a message asking them to call 1300 833 616 instead.
- **Change the recipient:** edit `TO_EMAIL` in `worker/wrangler.toml` and run `npx wrangler@4 deploy`.
- **Change the dropdown options:** edit both `src/pages/contact-us.html` and the `SERVICES` list at the top of `worker/src/index.js`. The Worker rejects any service it does not know.
- **Handover to another developer:** they need the Cloudflare and Resend accounts transferred, or they create their own and repeat steps 2 to 5. The 3 GoDaddy records stay; a new Resend account gives a new DKIM value for `resend._domainkey`.
