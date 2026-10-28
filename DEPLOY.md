# Deploy icapitalfinance.com.au for free

Fix email first. Follow `EMAIL-FIX.md` steps 1 and 2 before anything here. Step 1 there (moving DNS back to GoDaddy) is also step 1 for the website.

## Hosting choice: GitHub Pages

| | GitHub Pages | Cloudflare Pages | Netlify |
|---|---|---|---|
| Cost for this site | Free | Free | Free |
| Custom domain + free HTTPS | Yes | Yes | Yes |
| Keep DNS at GoDaddy | Yes, plain A/AAAA/CNAME records | Apex domain requires moving nameservers to Cloudflare | Yes, A + CNAME records |
| Built-in contact forms | No (use Formspree) | No (use Formspree) | Yes, Netlify Forms, 100 submissions/month |
| Bandwidth limit | 100 GB/month soft limit | Unlimited | 100 GB/month, then the site pauses on the free plan |
| Accounts needed | GitHub | Cloudflare (+ GitHub) | Netlify (+ GitHub) |

GitHub Pages is the pick. The site is 4 pages of static HTML, so bandwidth limits will never matter. DNS stays at GoDaddy next to your Microsoft 365 email records with no nameserver move, and you get version history of every change for free. Cloudflare would need your whole DNS zone moved to Cloudflare, which is one more account and one more place your email records could break. Netlify's only advantage here is built-in forms, and Formspree covers that on any host.

## What is in this folder

- `docs/` is the finished website. GitHub Pages serves this folder. It already contains `CNAME` (`icapitalfinance.com.au`), `404.html`, `sitemap.xml`, `robots.txt` and `.nojekyll`.
- `src/` and `build.py` are the editable source. Change text in `src/pages/*.html` or the header and footer in `src/layout.html`, then run `python3 build.py` to regenerate `docs/`.
- `recovered/` holds what was salvaged from the Wayback Machine. It is not published.

## Step 1. Put the site on GitHub (10 minutes)

1. Create a free account at https://github.com/signup if you do not have one.
2. Create a new **public** repository called `icapitalfinance` at https://github.com/new. Leave "Add a README" unticked. (Free GitHub Pages needs a public repository. Nothing in it is private.)
3. Upload the site. Either:
   - **No tools:** on the new repository page click **uploading an existing file** and drag in everything in this folder except `recovered/`, `tools/`, `EMAIL-FIX.md` and `.claude/`. Click **Commit changes**.
   - **Terminal:** run these in this folder, replacing `YOUR-GITHUB-USERNAME`:

```bash
git init -b main && git add . && git commit -m "Rebuild iCapital Finance website as static HTML"
```

```bash
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/icapitalfinance.git && git push -u origin main
```

4. In the repository go to **Settings → Pages**. Under **Build and deployment** set Source to **Deploy from a branch**, Branch to **main**, folder to **/docs**, and click **Save**.
5. In **Custom domain** type `icapitalfinance.com.au` and click **Save**. GitHub shows a DNS check that will fail until step 2 is done. That is expected.

Recommended: verify the domain so nobody else can claim it on GitHub. Click your profile picture → **Settings → Pages → Add a domain**, enter `icapitalfinance.com.au`, and add the `TXT` record GitHub shows you in step 2 below.

## Step 2. Point the domain at GitHub (GoDaddy DNS)

In GoDaddy → `icapitalfinance.com.au` → **DNS** → **DNS Records**:

1. Delete the default `A` record for `@` that GoDaddy created (it points to a GoDaddy "parked" page). Delete the default `CNAME` for `www` if there is one.
2. Leave every email record from `EMAIL-FIX.md` untouched (`MX`, the `TXT` starting `v=spf1`, `autodiscover`).
3. Add these 9 records:

| Type  | Name  | Value                              | TTL    |
|-------|-------|------------------------------------|--------|
| A     | `@`   | `185.199.108.153`                  | 1 Hour |
| A     | `@`   | `185.199.109.153`                  | 1 Hour |
| A     | `@`   | `185.199.110.153`                  | 1 Hour |
| A     | `@`   | `185.199.111.153`                  | 1 Hour |
| AAAA  | `@`   | `2606:50c0:8000::153`              | 1 Hour |
| AAAA  | `@`   | `2606:50c0:8001::153`              | 1 Hour |
| AAAA  | `@`   | `2606:50c0:8002::153`              | 1 Hour |
| AAAA  | `@`   | `2606:50c0:8003::153`              | 1 Hour |
| CNAME | `www` | `YOUR-GITHUB-USERNAME.github.io`   | 1 Hour |

The `www` value is your GitHub username followed by `.github.io`, with no repository name and no `https://`. GitHub sends `www.icapitalfinance.com.au` to `icapitalfinance.com.au` automatically.

Do not add a `CNAME` for `@`. GoDaddy does not allow it and it would break email.

## Step 3. Turn on HTTPS

1. Wait for DNS to update, usually 15 minutes to 1 hour.
2. Back in the repository go to **Settings → Pages**. The custom domain check should now show a green tick.
3. Tick **Enforce HTTPS**. If the box is greyed out, GitHub is still issuing the certificate. Wait up to 24 hours and try again.

## Step 4. Switch on the contact form (Formspree)

The contact form is set up for Formspree, which works on static hosting. Until you finish this step, the form opens the visitor's own email app with their message filled in, so no enquiries are lost.

1. Sign up free at https://formspree.io/register using `info@icapitalfinance.com.au`. Fix email first so the confirmation arrives.
2. Click **New Form**, name it "Website enquiries", and send submissions to `info@icapitalfinance.com.au`.
3. Copy the form ID. It is the part after `/f/` in the endpoint, for example `xpzgkqwe`.
4. Open `src/pages/contact-us.html`, replace `YOUR_FORM_ID` with that ID, run `python3 build.py`, and upload or push the updated `docs/contact-us/index.html`.
5. Under the form's **Settings** in Formspree, add `icapitalfinance.com.au` to **Restrict to domain** to block spam sent from elsewhere.

The free plan allows 50 submissions a month.

## Step 5. Check it worked

- https://icapitalfinance.com.au loads with a padlock.
- https://www.icapitalfinance.com.au redirects to it.
- https://icapitalfinance.com.au/about/, /services/ and /contact-us/ load. Old links to /home/ and /elementor-236/ redirect.
- A made-up address such as https://icapitalfinance.com.au/xyz shows the custom 404 page.
- Send yourself a test enquiry from the contact page.
- Email still works (send a test from Gmail to `info@icapitalfinance.com.au`).
- Optional: add the site at https://search.google.com/search-console and submit `https://icapitalfinance.com.au/sitemap.xml`.

## Before you go live, please review

- **Credit licence number.** ASIC requires Australian credit assistance providers to show their Australian Credit Licence number or Credit Representative number on their website. The old site did not show one. Add yours in `src/layout.html`, where a comment marks the spot in the footer.
- **About, Services and Contact text.** The Wayback Machine never saved those pages, so I wrote them using only facts from the homepage. Check the wording, especially the line naming Wendy Lee.
- **Logo.** The full logo image was not archived. The house mark is traced from Google's cached copy of your favicon, and the "iCapital Finance" wordmark beside it is set in Poppins. If you have the original logo file, send it over and I will swap it in.
- **Photos.** The original photos were lost. The replacements are free-licence photos from Unsplash (no attribution required).
- **Hero video.** The old homepage played an ANZ Home Loans TV advert as a background video. It was not reused because it belongs to ANZ.
