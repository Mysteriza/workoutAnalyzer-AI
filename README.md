# AI Workout Analyzer

Aplikasi web personal untuk menarik data olahraga dari Strava, memvisualisasikan metrik dengan chart interaktif, dan mendapatkan analisis fisiologis mendalam menggunakan Google Gemini AI.

## Features

- **Strava Integration** - OAuth authentication untuk mengambil aktivitas olahraga
- **Activity Caching** - Aktivitas di-cache di localStorage untuk menghemat API request
- **Complete Data Display** - Menampilkan semua data dari Strava (HR, Speed, Power, Cadence, Calories, Segments, Splits)
- **Interactive Charts** - Visualisasi Heart Rate dan Speed menggunakan Recharts
- **Segment Analysis** - Daftar segment efforts dengan PR ranks dan achievements
- **Splits Table** - Analisis per-km dengan pace comparison
- **AI Analysis** - Analisis fisiologis mendalam dengan Google Gemini AI
- **Gear-Aware Analysis** - AI mempertimbangkan jenis peralatan (sepeda/sepatu) dalam analisis
- **Persistent Analysis** - Hasil analisis tersimpan di localStorage
- **Export Data** - Export data aktivitas dan hasil analisis AI
- **User Profile** - Input data fisiologis (usia, berat, tinggi, RHR)
- **Mobile Responsive** - UI responsif untuk tampilan desktop dan mobile
- **Dark Mode** - UI modern dengan dark mode sebagai default

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Charts:** Recharts
- **Icons:** Lucide React
- **AI SDK:** @google/generative-ai (Gemini 3 Flash)
- **State Management:** Zustand
- **Storage:** localStorage (client) + .env.local (server)

## Installation

1. Clone repository dan install dependencies:

```bash
cd workoutAnalyzer-AI
npm install
```

2. Konfigurasi environment variables di `.env.local`:

```env
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Jalankan development server:

```bash
npm run dev
```

4. Buka `http://localhost:3000` di browser.

## Strava API Setup

1. Buka [Strava API Settings](https://www.strava.com/settings/api)
2. Buat aplikasi baru atau gunakan yang sudah ada
3. Set **Authorization Callback Domain** ke `localhost`
4. Copy **Client ID** dan **Client Secret** ke `.env.local`

## Usage

1. Buka halaman **Settings** (`/settings`)
2. Isi data fisiologis Anda (usia, berat badan, tinggi, resting heart rate)
3. Klik **Hubungkan ke Strava** untuk autentikasi
4. Setelah terkoneksi, kembali ke Dashboard untuk melihat aktivitas
5. Aktivitas akan di-cache secara otomatis untuk mengurangi API request
6. Klik tombol **Refresh** untuk memaksa update dari Strava
7. Klik aktivitas untuk melihat detail lengkap termasuk:
   - Metrik utama (jarak, durasi, elevasi, speed, HR, power)
   - Chart interaktif Heart Rate & Speed
   - Segment efforts dengan PR dan achievements
   - Splits per-km dengan pace analysis
8. Klik **Analisis Aktivitas** untuk mendapatkan AI analysis
9. Hasil analisis otomatis tersimpan dan dapat di-export ke markdown
10. Klik **Export** untuk menyimpan data aktivitas ke JSON

## AI Analysis Features

AI Analysis memberikan insight mendalam termasuk:

- Analisis zona jantung berbasis Karvonen
- Deteksi cardiac drift dan bonking
- Evaluasi performa paruh pertama vs kedua
- Protokol nutrisi dan pemulihan dengan menu Indonesia
- Pertimbangan gear/peralatan yang digunakan
- Rencana aksi 24 jam

## Data Caching

- Aktivitas di-cache di localStorage
- Cache diperbarui otomatis setiap 5 menit
- Tombol Refresh untuk memaksa update
- Analisis AI tersimpan per-aktivitas

## Data yang Ditampilkan

- Jarak, Durasi, Elevasi
- Average/Max Speed
- Average/Max Heart Rate
- Cadence (untuk Run dan Ride)
- Power/Watts (jika tersedia)
- Kilojoules/Calories
- Relative Effort (Suffer Score)
- Achievements, PRs, Kudos
- Segment Efforts dengan details
- Splits per-km dengan pace analysis
- Gear/Equipment info

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── strava/
│   │   │   ├── auth/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── activities/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── streams/[id]/route.ts
│   │   └── analyze/route.ts
│   ├── activity/[id]/page.tsx
│   ├── settings/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── ActivityCard.tsx
│   ├── ActivityChart.tsx
│   ├── ActivityList.tsx
│   ├── AIAnalysis.tsx
│   ├── ExportDataButton.tsx
│   ├── Header.tsx
│   ├── SegmentList.tsx
│   ├── SplitsTable.tsx
│   └── UserSettings.tsx
├── store/
│   ├── activityStore.ts
│   └── userStore.ts
├── types/
│   └── index.ts
└── utils/
    ├── gemini.ts
    ├── storage.ts
    └── strava.ts
```

## Dependencies

- `next` - React framework
- `react`, `react-dom` - React core
- `@google/generative-ai` - Gemini AI SDK
- `recharts` - Chart library
- `lucide-react` - Icon library
- `zustand` - State management
- `react-markdown` - Markdown renderer
- `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-tabs` - Shadcn UI primitives
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities
