# CardioKernel

**[Bahasa Indonesia](README.md) | [English](README-EN.md)**

Aplikasi web untuk menganalisis data latihan dari Strava dengan AI-powered insights menggunakan Google Gemini AI.

## Screenshots
<img width="1900" height="923" alt="image" src="https://github.com/user-attachments/assets/674150e1-debd-40b7-b477-a4a89a131181" />
<img width="1920" height="2792" alt="screencapture-workout-analyzer-ai-vercel-app-activity-17076535827-2026-01-19-13_12_09" src="https://github.com/user-attachments/assets/e5609886-93cb-4f88-af45-11413baf7c5e" />


## Features

- **Strava Integration** - OAuth authentication untuk mengambil aktivitas
- **AI Analysis** - Analisis fisiologis dengan Gemini 3 Flash
- **Rate Limits** - 20 requests/day (reset midnight Pacific ~3 PM WIB)
- **Interactive Charts** - Visualisasi HR, Speed, Power dengan Recharts
- **Segment Analysis** - PR ranks dan achievements
- **Splits Table** - Analisis per-km dengan pace comparison
- **Gear-Aware** - AI mempertimbangkan jenis peralatan
- **Export Data** - Export aktivitas (JSON) dan analisis (Markdown)
- **User Profile** - Input data fisiologis (usia, berat, tinggi, RHR)
- **Cloud Sync** - Analisis dan settings tersimpan di MongoDB
- **Dark Mode** - UI modern dengan dark mode default

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

Buat file `.env.local`:

```env
STRAVA_CLIENT_ID=<dari Strava API Settings>
STRAVA_CLIENT_SECRET=<dari Strava API Settings>
GEMINI_API_KEY=<dari Google AI Studio>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGODB_URI=<dari MongoDB Atlas>
AUTH_SECRET=<openssl rand -base64 32>
```

## API Setup

**Strava:**

1. Buka [Strava API Settings](https://www.strava.com/settings/api)
2. Buat aplikasi, set callback domain ke `localhost`
3. Copy Client ID dan Secret

**Gemini:**

1. Buka [Google AI Studio](https://aistudio.google.com/)
2. Klik Get API Key → Create API Key

**MongoDB:**

1. Buat cluster di [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist IP `0.0.0.0/0`
3. Copy connection string

## Running

```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Production server
```

## Usage

1. Login dengan Strava OAuth
2. Isi profil fisiologis di Settings
3. Pilih aktivitas dari Dashboard
4. Klik "Generate Analysis" untuk AI insights
5. Export hasil ke markdown jika perlu

## AI Analysis Output

- Ringkasan & Quality Score (1-10)
- Analisis Zona HR (tabel dengan Tanaka formula)
- Detektif Performa (gear, pacing, stamina)
- Nutrisi & Recovery (kebutuhan + menu Indonesia)
- Saran Sesi Berikutnya

## Rate Limits

| Metric | Limit                 |
| ------ | --------------------- |
| RPM    | 5 requests/minute     |
| TPM    | 250,000 tokens/minute |
| RPD    | 20 requests/day       |

Reset daily pada midnight Pacific Time (~3 PM WIB).

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
