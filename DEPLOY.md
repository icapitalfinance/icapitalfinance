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

On 2 November 2026 the site was rebuilt from the original hosting backup (`icapitalfinance.sql` and `icapitalfinance.zip`). Every page now uses the original wording, photos, icons and layout of the 2022 Elementor site, rebuilt by hand as plain HTML, CSS and JavaScript with no WordPress. The original backup is not stored in this repository.

Photos are served as AVIF, then WebP, then JPEG, with 800 px versions for phones. Photos further down each page load only as the visitor scrolls near them. `tools/optimize_images.py` regenerates every photo from the backup's `wp-content/uploads` folder: unzip `icapitalfinance.zip` somewhere and pass that folder's path.

## Step 1. Put the site on GitHub (done 28 October 2026)

- Repository: https://github.com/icapitalfinance/icapitalfinance (public, owned by the `icapitalfinance` GitHub organisation).
- GitHub Pages: **Settings → Pages** serves branch `main`, folder `/docs`, custom domain `icapitalfinance.com.au`.

To publish a change later, edit `src/`, run `python3 build.py`, then commit and push:

```bash
git add -A && git commit -m "Describe the change" && git push
```

GitHub rebuilds the site within about a minute of each push.

Domain verified on 29 October 2026: the organisation's Pages settings list `icapitalfinance.com.au` as verified, which stops any other GitHub account from claiming it. Keep the GoDaddy `TXT` record `_github-pages-challenge-icapitalfinance` permanently. Deleting it removes that protection.

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
| CNAME | `www` | `icapitalfinance.github.io`   | 1 Hour |

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

## Step 6. Count visitors (Cloudflare Web Analytics)

GitHub Pages shows no bandwidth or visitor figures, so use Cloudflare's free analytics. It needs no cookies, and DNS stays at GoDaddy.

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. Open **Web Analytics** (under **Analytics & Logs**), choose **Add a site**, enter `icapitalfinance.com.au`, and pick the manual JavaScript snippet option.
3. Copy the token from the snippet. It is the value after `"token":`.
4. Paste it into `ANALYTICS_TOKEN` at the top of `build.py`, run `python3 build.py`, then commit and push.

Multiply monthly pageviews by 0.33 MB for the most bandwidth the site could have used, against the 100 GB soft limit.

## Before you go live, please review

- **Credit licence number.** ASIC requires Australian credit assistance providers to show their Australian Credit Licence number or Credit Representative number on their website. The original site did not show one. Add yours in `src/layout.html`, where a comment marks the spot in the footer.
- **Hero video.** As on the original site, the homepage hero plays a muted YouTube clip (`4WVWdZP5t8Y`, seconds 15 to 39, an ANZ Home Loans advert) behind the text on screens wider than 1024 px. Phones and tablets show the still photo. To drop the video, delete the `hero__video` line in `src/pages/index.html` and rebuild.
- **Original wording kept as it was.** Typos in the original are reproduced, for example "Qualiified Professional Team" on the homepage, and the Business/Commercial Loans section on the Services page repeats the residential loans paragraph. Fix them in `src/pages/` if you want.
