# Panduan Deployment Production

**[Bahasa Indonesia](DEPLOYMENT_GUIDE.md) | [English](DEPLOYMENT_GUIDE_EN.md)**

Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)** dan **MongoDB (Mongoose)**. Untuk memastikan performa dan stabilitas maksimal, panduan ini merekomendasikan **Vercel** sebagai platform hosting utama, karena dukungan native-nya untuk Node.js runtime yang dibutuhkan oleh driver MongoDB.

> [!WARNING]
> **Mengapa bukan Cloudflare Pages?**
> Cloudflare Pages berjalan di _Edge Runtime_ (Workers). Driver MongoDB standar (Mongoose) menggunakan koneksi TCP yang sering kali tidak stabil atau tidak didukung penuh di lingkungan Edge gratisan tanpa konfigurasi tingkat lanjut (seperti TCP proxy atau Data API). Vercel adalah "Zero Config" solution untuk stack ini.

## 1. Persiapan (Prerequisites)

Sebelum deploy, pastikan Anda memiliki:

1.  Akun **GitHub** (Repo project ini harus sudah dipush).
2.  Akun **Vercel** (Bisa login dengan GitHub).
3.  Akun **MongoDB Atlas** (Database Cloud).
4.  Akun **Strava** (Untuk API settings).

## 2. Push ke GitHub

Pastikan kode lokal Anda sudah dipush ke repository GitHub private/public.

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 3. Deploy ke Vercel

1.  Buka dashboard [Vercel](https://vercel.com/dashboard).
2.  Klik **"Add New..."** -> **"Project"**.
3.  Import repository `workout-analyzer-ai` Anda.
4.  Di halaman **Configure Project**:
    - **Framework Preset**: Next.js (Otomatis terdeteksi).
    - **Root Directory**: `./` (Default).
    - **Environment Variables**: Masukkan semua key dari `.env.local` Anda:

    | Key                    | Value                                                                |
    | :--------------------- | :------------------------------------------------------------------- |
    | `MONGODB_URI`          | `mongodb+srv://...` (Connection string dari Atlas)                   |
    | `STRAVA_CLIENT_ID`     | Client ID dari Strava Settings                                       |
    | `STRAVA_CLIENT_SECRET` | Client Secret dari Strava Settings                                   |
    | `AUTH_SECRET`          | String acak panjang (bisa generate ulang: `openssl rand -base64 32`) |
    | `GEMINI_API_KEY`       | API Key Google Gemini AI                                             |
    | `NEXT_PUBLIC_BASE_URL` | _Kosongkan dulu, nanti diupdate setelah dapat domain_                |

5.  Klik **Deploy**. Tunggu hingga selesai (biasanya 1-2 menit).

## Alternatif: Deploy ke Netlify

Jika Anda lebih memilih Netlify, platform ini juga mendukung Next.js + MongoDB melalui Netlify Runtime/Adapter.

1.  Buka [Netlify Dashboard](https://app.netlify.com/).
2.  Klik **"Add new site"** -> **"Import an existing project"**.
3.  Pilih **GitHub** dan cari repo `workout-analyzer-ai`.
4.  **Build Settings** (biasanya otomatis terisi):
    - **Build command**: `npm run build`
    - **Publish directory**: `.next`
5.  **Environment Variables**:
    - Klik **"Add environment variables"** (atau atur nanti di Site Configuration).
    - Masukkan semua variabel yang sama seperti Vercel (`MONGODB_URI`, `AUTH_SECRET`, dll).
6.  Klik **Deploy site**.
    - _Catatan_: Netlify otomatis menggunakan plugin `@netlify/plugin-nextjs` untuk menghandle SSR dan API Routes.

## 4. Konfigurasi Pasca-Deploy (PENTING)

Setelah website live (misal: `https://workout-analyzer.vercel.app`), Anda harus mengupdate konfigurasi agar Login Strava berfungsi.

### A. Update Strava API Settings

1.  Buka [Strava API Settings](https://www.strava.com/settings/api).
2.  Cari kolom **Authorization Callback Domain**.
3.  Ganti `localhost` dengan domain baru Anda (tanpa `https://` dan tanpa path).
    - Contoh: `workout-analyzer.vercel.app`
4.  Klik **Save**.

### B. Update Environment Variable (Vercel)

1.  Kembali ke Dashboard Project di Vercel.
2.  Masuk ke **Settings** -> **Environment Variables**.
3.  Tambahkan/Edit variabel `NEXT_PUBLIC_BASE_URL`:
    - Value: `https://workout-analyzer.vercel.app` (Pakai `https://`)
4.  Masuk ke tab **Deployments**, klik titik tiga di deployment terakhir -> **Redeploy** (agar env var baru terbaca).

## 5. Verifikasi

1.  Buka website production Anda.
2.  Coba **Login with Strava**. Jika redirect sukses, berarti konfigurasi Strava API benar.
3.  Buka **Settings**, coba update profil (Test database connection).
4.  Buka salah satu aktivitas, coba **Analisis AI** (Test Gemini API & Rate Limiting).

## Troubleshooting

- **Login Error / Redirect Mismatch**: Cek kembali "Authorization Callback Domain" di Strava. Pastikan **sama persis** dengan domain website.
- **Database Connection Error**: Pastikan di MongoDB Atlas -> **Network Access**, Anda sudah whitelist IP `0.0.0.0/0` (Allow Access from Anywhere) karena IP Vercel berubah-ubah.
- **AI Analysis Error**: Cek kuota Gemini API atau Logs di dashboard Vercel (`Functions` tab).

---

**Catatan Keamanan**:
Pastikan `environment variables` di Vercel tercatat dengan benar dan jangan pernah commit file `.env.local` ke GitHub.
