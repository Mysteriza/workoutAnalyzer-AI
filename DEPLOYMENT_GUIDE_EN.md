# Production Deployment Guide

**[Bahasa Indonesia](DEPLOYMENT_GUIDE.md) | [English](DEPLOYMENT_GUIDE_EN.md)**

This application is built using **Next.js 15 (App Router)** and **MongoDB (Mongoose)**. For maximum performance and compatibility, this guide recommends **Vercel** as the primary hosting platform due to its native support for the Node.js runtime required by MongoDB drivers.

> [!WARNING]
> **Why not Cloudflare Pages?**
> Cloudflare Pages runs on the _Edge Runtime_ (Workers). Standard MongoDB drivers (Mongoose) use TCP connections which are often unstable or not fully supported in the free Edge environment without advanced configuration (like TCP proxies or Data API). Vercel is the "Zero Config" solution for this stack.

## 1. Prerequisites

Before deploying, ensure you have:

1.  **GitHub Account** (Repo must be pushed).
2.  **Vercel Account** (Login with GitHub).
3.  **MongoDB Atlas Account** (Cloud Database).
4.  **Strava Account** (For API settings).

## 2. Push to GitHub

Ensure your local code is committed and pushed to your repository.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 3. Deploy to Vercel (Recommended)

1.  Open [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `workout-analyzer-ai` repository.
4.  In the **Configure Project** page:
    - **Framework Preset**: Next.js (Auto-detected).
    - **Root Directory**: `./` (Default).
    - **Environment Variables**: Enter all keys from your `.env.local`:

    | Key                    | Value                                                      |
    | :--------------------- | :--------------------------------------------------------- |
    | `MONGODB_URI`          | `mongodb+srv://...` (Connection string from Atlas)         |
    | `STRAVA_CLIENT_ID`     | Client ID from Strava Settings                             |
    | `STRAVA_CLIENT_SECRET` | Client Secret from Strava Settings                         |
    | `AUTH_SECRET`          | A long random string (generate: `openssl rand -base64 32`) |
    | `GEMINI_API_KEY`       | API Key from Google AI Studio                              |
    | `NEXT_PUBLIC_BASE_URL` | _Leave empty for now, update after getting domain_         |

5.  Click **Deploy**. Wait for completion (usually 1-2 minutes).

## Alternative: Deploy to Netlify

Netlify also supports Next.js + MongoDB via their Runtime/Adapter.

1.  Open [Netlify Dashboard](https://app.netlify.com/).
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Select **GitHub** and find `workout-analyzer-ai`.
4.  **Build Settings** (auto-filled):
    - **Build command**: `npm run build`
    - **Publish directory**: `.next`
5.  **Environment Variables**:
    - Add the same variables as Vercel (`MONGODB_URI`, `AUTH_SECRET`, etc.).
6.  Click **Deploy site**.
    - _Note_: Netlify automatically uses the `@netlify/plugin-nextjs` plugin.

## 4. Post-Deployment Configuration (CRITICAL)

After the website is live (e.g., `https://workout-analyzer.vercel.app`), you MUST update the Strava config.

### A. Update Strava API Settings

1.  Go to [Strava API Settings](https://www.strava.com/settings/api).
2.  Find **Authorization Callback Domain**.
3.  Replace `localhost` with your new domain (without `https://` and path).
    - Example: `workout-analyzer.vercel.app`
4.  Click **Save**.

### B. Update Environment Variable

1.  Go to your Project Dashboard (Vercel/Netlify).
2.  Go to **Settings** -> **Environment Variables**.
3.  Add/Edit `NEXT_PUBLIC_BASE_URL`:
    - Value: `https://workout-analyzer.vercel.app` (Use `https://`)
4.  **Redeploy** (Go to Deployments tab -> Redeploy) to ensure the new variable is picked up.

## 5. Verification

1.  Open your production website.
2.  Try **Login with Strava**. If redirect works, Strava API is configured correctly.
3.  Open **Settings**, try updating profile (Test DB connection).
4.  Open an activity, try **Analisis AI** (Test Gemini API).

## Troubleshooting

- **Login Error**: Check "Authorization Callback Domain" in Strava. Must match your site domain nicely.
- **DB Error**: Ensure MongoDB Atlas **Network Access** allows `0.0.0.0/0` (Access from Anywhere) since serverless IPs change.
- **AI Error**: Check Gemini API quota.

---

**Security Note**:
Never commit `.env.local` to GitHub. Use the hosting dashboard for secrets.
