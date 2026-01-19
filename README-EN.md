# CardioKernel

**[Bahasa Indonesia](README.md) | [English](README-EN.md)**

Web application to analyze workout data from Strava with AI-powered insights using Google Gemini AI.

## Features

- **Strava Integration** - OAuth authentication for fetching activities
- **AI Analysis** - Physiological analysis with Gemini 3 Flash
- **Rate Limits** - 20 requests/day (resets at midnight Pacific)
- **Interactive Charts** - HR, Speed, Power visualization with Recharts
- **Segment Analysis** - PR ranks and achievements
- **Splits Table** - Per-km analysis with pace comparison
- **Gear-Aware** - AI considers equipment type in analysis
- **Export Data** - Export activities (JSON) and analysis (Markdown)
- **User Profile** - Input physiological data (age, weight, height, RHR)
- **Cloud Sync** - Analysis and settings stored in MongoDB
- **Dark Mode** - Modern UI with dark mode default

## Tech Stack

| Category  | Technology               |
| --------- | ------------------------ |
| Framework | Next.js 15 + TypeScript  |
| Styling   | Tailwind CSS + Shadcn UI |
| Charts    | Recharts                 |
| AI        | Google Gemini 3 Flash    |
| State     | Zustand                  |
| Database  | MongoDB Atlas            |
| Auth      | NextAuth.js v5           |

## Installation

```bash
git clone https://github.com/Mysteriza/workoutAnalyzer-AI.git
cd workoutAnalyzer-AI
npm install
```

## Environment Variables

Create `.env.local` file:

```env
STRAVA_CLIENT_ID=<from Strava API Settings>
STRAVA_CLIENT_SECRET=<from Strava API Settings>
GEMINI_API_KEY=<from Google AI Studio>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGODB_URI=<from MongoDB Atlas>
AUTH_SECRET=<openssl rand -base64 32>
```

## API Setup

**Strava:**

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create app, set callback domain to `localhost`
3. Copy Client ID and Secret

**Gemini:**

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click Get API Key → Create API Key

**MongoDB:**

1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist IP `0.0.0.0/0`
3. Copy connection string

## Running

```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Production server
```

## Usage

1. Login with Strava OAuth
2. Fill physiological profile in Settings
3. Select activity from Dashboard
4. Click "Generate Analysis" for AI insights
5. Export results to markdown if needed

## AI Analysis Output

- Summary & Quality Score (1-10)
- HR Zone Analysis (table with Tanaka formula)
- Performance Detective (gear, pacing, stamina)
- Nutrition & Recovery (needs + Indonesian menu)
- Next Session Suggestions

## Rate Limits

| Metric | Limit                 |
| ------ | --------------------- |
| RPM    | 5 requests/minute     |
| TPM    | 250,000 tokens/minute |
| RPD    | 20 requests/day       |

Resets daily at midnight Pacific Time.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── strava/       # Strava OAuth & data
│   │   ├── analyze/      # AI analysis endpoint
│   │   ├── model/        # Model info endpoint
│   │   └── usage/        # Usage tracking
│   ├── activity/[id]/    # Activity detail page
│   └── settings/         # User settings
├── components/
│   ├── ui/               # Shadcn components
│   ├── AIAnalysis.tsx    # AI coach component
│   └── Header.tsx        # Navigation
├── store/
│   ├── userStore.ts      # User profile state
│   └── usageStore.ts     # API usage tracking
└── utils/
    ├── gemini.ts         # AI prompt builder
    └── storage.ts        # LocalStorage utils
```

## Author

**Mysteriza** - mysteriza@proton.me

Built with Antigravity IDE.
