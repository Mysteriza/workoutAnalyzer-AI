# Workout Analyzer AI

**[Bahasa Indonesia](README.md) | [English](README-EN.md)**

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
- **AI SDK:** @google/generative-ai (Gemini 3 Flash Preview)
- **State Management:** Zustand
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** NextAuth.js (v5 Beta)
- **Storage:** localStorage (client cache) + Cloud DB (Analysis & Settings)

## Installation

1. Clone repository dan install dependencies:

```bash
git clone https://github.com/Mysteriza/workoutAnalyzer-AI.git
cd workoutAnalyzer-AI
npm install
```

2. Konfigurasi environment variables di `.env.local`:

### A. Mendapatkan Strava API

1. Login ke [Strava Settings API](https://www.strava.com/settings/api).
2. Buat Aplikasi Baru.
3. **Authorization Callback Domain**: Isi `localhost` (untuk development).
4. Salin **Client ID** dan **Client Secret**.

### B. Mendapatkan Google Gemini API

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Klik **Get API Key** -> **Create API Key**.
3. Salin key yang dimulai dengan `AIza...`.

### C. Setup MongoDB Atlas

1. Buat akun di [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Tier).
2. Buat Cluster baru.
3. **Database Access**: Buat user & password database.
4. **Network Access**: Whitelist IP `0.0.0.0/0` (Allow from Anywhere).
5. Klik **Connect** -> **Drivers** -> Copy connection string (ganti `<password>` dengan password user tadi).

### D. Generate Auth Secret

Jalankan perintah ini di terminal untuk membuat secret key aman:

```bash
openssl rand -base64 32
```

### Isi File `.env.local`

```env
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://user:pass@cluster...
AUTH_SECRET=your_generated_secret
```

3. Jalankan development server:

```bash
npm run dev
```

4. Buka `http://localhost:3000` di browser.

**Untuk production:**

```bash
npm run build
npm start
```

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
5. Klik **Refresh** untuk menarik data terbaru dari Strava (Cache tidak update otomatis)
6. Klik aktivitas untuk melihat detail lengkap termasuk:
   - Metrik utama (jarak, durasi, elevasi, speed, HR, power)
   - Chart interaktif Heart Rate & Speed
   - Segment efforts dengan PR dan achievements
   - Splits per-km dengan pace analysis
7. Klik **Analisis Aktivitas** untuk mendapatkan AI analysis
8. Hasil analisis otomatis tersimpan dan dapat di-export ke markdown
9. Klik **Export** untuk menyimpan data aktivitas ke JSON

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
- Cache hanya diperbarui saat user menekan tombol Refresh
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
│   ├── gemini.ts
│   ├── storage.ts
│   └── strava.ts
```

## Dependencies

- `next` - React framework
- `react`, `react-dom` - React core
- `@google/generative-ai` - Gemini AI SDK
- `recharts` - Chart library
- `lucide-react` - Icon library
- `zustand` - State management
- `react-markdown` - Markdown renderer
- `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `@radix-ui/react-select` - Shadcn UI primitives
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities
