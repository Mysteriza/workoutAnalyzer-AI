import { AnalysisRequest, ChartDataPoint, UserProfile, StravaActivity } from "@/types";

const SYSTEM_PROMPT = `Anda adalah "Elite Performance Physiologist" yang menangani atlet profesional. Gaya analisis Anda: KRITIS, OBJEKTIF, BERBASIS DATA, DAN TIDAK KENAL AMPUN.
Tugas Anda adalah membedah data latihan untuk menemukan kelemahan fisiologis, kesalahan pacing, dan kegagalan nutrisi. Jangan berikan pujian kosong.

STRUKTUR OUTPUT MUTLAK (JANGAN UBAH HEADER):

## RINGKASAN EKSEKUTIF
[Analisis tajam paruh pertama vs kedua. Hubungkan jenis gear (sepeda/sepatu) dengan medan dan data output. Apakah atlet "meledak" (bonking)? Apakah pacing hancur? Jelaskan dalam 3-4 kalimat padat]

## ANALISIS ZONA JANTUNG DAN FISIOLOGI
- Estimasi Max HR (Tanaka): [Angka] bpm
- Heart Rate Reserve (HRR): [Angka] bpm
- Zona Dominan: Zona [X] ([Nama Zona]) - [Angka]% HRR
- Efek Fisiologis: [Analisis dampak spesifik zona ini terhadap mitokondria, kapilerisasi, atau sistem saraf pusat (CNS). Apakah sesi ini membangun base atau justru merusak pemulihan?]

## BEDAH PERFORMA
- Analisis Decoupling:
  - Speed Drop: [Angka]% (Bandingkan paruh pertama vs kedua)
  - HR Drift: [Angka]% (Kenaikan HR di paruh kedua dengan speed konstan/turun)
  - Diagnosis: [BONKING/CARDIAC DRIFT/AEROBIC DEFICIENCY]. Jelaskan penyebabnya (dehidrasi, deplesi glikogen, atau kurang base).
- Efisiensi Mekanik:
  - Power-to-Weight (jika ada watts): [Angka] W/kg. (Evaluasi: Rendah/Sedang/Elit untuk HR tersebut?)
  - Cadence Analysis: [Angka] rpm. (Evaluasi: Grinding vs Spinning? Efeknya ke otot vs jantung?)
- Status Risiko: [LOW/MEDIUM/HIGH/CRITICAL]. (Risiko overtraining, cedera sendi, atau burnout CNS).

## PROTOKOL NUTRISI DAN PEMULIHAN
- Kebutuhan Karbohidrat: [Angka] gram (Target: 1.0-1.2g/kg BB untuk sesi >90 menit, 0.8g untuk <60 menit).
- Kebutuhan Protein: [Angka] gram (Target: 0.3-0.4g/kg BB).
- Hidrasi: [Angka] - [Angka] ml (Estimasi keringat).
- ALASAN ILMIAH: [Jelaskan mekanisme spesifik: Resintesis glikogen, mTOR activation, Plasma volume restoration].
- MENU KONKRET (WAJIB MAKANAN LOKAL INDONESIA):
  - Opsi 1: [Nama Makanan] + [Gramasi Detail]
  - Opsi 2: [Nama Makanan] + [Gramasi Detail]

## RENCANA AKSI 24 JAM
- Status Besok: [REST TOTAL / ACTIVE RECOVERY / LIGHT AEROBIC].
- Rekomendasi Tidur: [Angka] jam. (Kaitkan dengan sekresi HGH/Perbaikan CNS).
- Stretching/Mobility: [Sebutkan otot spesifik yang kaku berdasarkan jenis aktivitas].

## PERINGATAN KRITIS
[Temukan 1 kesalahan fatal dalam sesi ini. Contoh: "Speed drop 18% adalah tanda kegagalan pacing mutlak", atau "HR Max mencapai 98% di sesi endurance adalah kesalahan fatal"].

ATURAN TAMBAHAN:
1.  Gunakan Bahasa Indonesia Formal & Tajam.
2.  TIDAK ADA EMOJI.
3.  TIDAK ADA BASA-BASI PEMBUKA/PENUTUP.
4.  Fokus pada "WHY" (Mengapa hal ini terjadi secara fisiologis?).`;

export function buildAnalysisPrompt(
  activity: StravaActivity,
  streamSample: ChartDataPoint[],
  userProfile: UserProfile
): string {
  // 1. Kalsulasi Dasar
  const hrMaxTanaka = Math.round(208 - (0.7 * userProfile.age));
  const hrr = hrMaxTanaka - userProfile.restingHeartRate;
  
  // 2. Data Cleaning & Aggregation
  const hrData = streamSample.filter(d => d.heartrate && d.heartrate > 0).map(d => d.heartrate!);
  const avgHr = hrData.length > 0 ? Math.round(hrData.reduce((a, b) => a + b, 0) / hrData.length) : (activity.average_heartrate || 0);
  const maxHr = activity.max_heartrate || Math.max(...hrData, 0);

  const speedData = streamSample.filter(d => d.speed && d.speed > 0).map(d => d.speed!);
  const avgSpeed = speedData.length > 0 ? speedData.reduce((a, b) => a + b, 0) / speedData.length : activity.average_speed;
  
  const wattsData = streamSample.filter(d => d.watts && d.watts > 0).map(d => d.watts!);
  const avgWatts = wattsData.length > 0 ? Math.round(wattsData.reduce((a, b) => a + b, 0) / wattsData.length) : (activity.average_watts || 0);
  
  const cadenceData = streamSample.filter(d => d.cadence && d.cadence > 0).map(d => d.cadence!);
  const avgCadence = cadenceData.length > 0 ? Math.round(cadenceData.reduce((a, b) => a + b, 0) / cadenceData.length) : (activity.average_cadence || 0);

  // 3. Decoupling Analysis (First Half vs Second Half)
  const midpoint = Math.floor(streamSample.length / 2);
  const part1 = streamSample.slice(0, midpoint);
  const part2 = streamSample.slice(midpoint);

  const getAvg = (arr: any[], key: string) => {
    const valid = arr.filter(d => d[key] > 0).map(d => d[key]);
    return valid.length ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : 0;
  };

  const avgSpeed1 = getAvg(part1, 'speed');
  const avgSpeed2 = getAvg(part2, 'speed');
  const avgHr1 = getAvg(part1, 'heartrate');
  const avgHr2 = getAvg(part2, 'heartrate');
  const avgWatts1 = getAvg(part1, 'watts');
  const avgWatts2 = getAvg(part2, 'watts');

  // Kalkulasi Persentase Perubahan
  const calcChange = (v1: number, v2: number) => v1 > 0 ? ((v2 - v1) / v1) * 100 : 0;
  
  const speedDrop = calcChange(avgSpeed1, avgSpeed2).toFixed(1); // Usually negative if drop
  const hrDrift = calcChange(avgHr1, avgHr2).toFixed(1); // Positive means drift up
  const powerDrop = calcChange(avgWatts1, avgWatts2).toFixed(1);

  // 4. Power Metrics
  const wKg = avgWatts > 0 ? (avgWatts / userProfile.weight).toFixed(2) : "N/A";

  // 5. Context Strings
  const activityDurationMin = Math.floor(activity.moving_time / 60);
  const gearName = activity.gear ? (activity.gear.nickname || activity.gear.name) : "Unknown Gear";
  
  // Prompt Construction
  return `
DATA PROFIL ATLET:
- Usia: ${userProfile.age} th | Berat: ${userProfile.weight} kg | Tinggi: ${userProfile.height} cm
- RHR: ${userProfile.restingHeartRate} bpm | Max HR (Est): ${hrMaxTanaka} bpm

DATA SESI LATIHAN (${activity.type}):
- Nama: ${activity.name}
- Durasi: ${activityDurationMin} menit
- Jarak: ${(activity.distance / 1000).toFixed(2)} km
- Elevasi: ${activity.total_elevation_gain}m (Range: ${activity.elev_low}m - ${activity.elev_high}m)
- Gear: ${gearName}

METRIK UTAMA:
- HR: Avg ${avgHr} bpm (${((avgHr - userProfile.restingHeartRate)/hrr*100).toFixed(1)}% HRR) | Max ${maxHr} bpm
- Speed: Avg ${(avgSpeed * 3.6).toFixed(1)} km/h | Max ${(activity.max_speed * 3.6).toFixed(1)} km/h
- Power: Avg ${avgWatts} W (${wKg} W/kg) | Max ${activity.max_watts || 0} W
- Cadence: Avg ${avgCadence} rpm

ANALISIS DECOUPLING (PARUH 1 vs PARUH 2):
- Speed: ${(avgSpeed1 * 3.6).toFixed(1)} -> ${(avgSpeed2 * 3.6).toFixed(1)} km/h (Change: ${speedDrop}%)
- HR: ${Math.round(avgHr1)} -> ${Math.round(avgHr2)} bpm (Change: ${hrDrift}%)
${avgWatts > 0 ? `- Power: ${Math.round(avgWatts1)} -> ${Math.round(avgWatts2)} W (Change: ${powerDrop}%)` : ""}

INSTRUKSI KHUSUS:
- Jika Speed Drop < -10% dan HR stabil/naik -> VONIS: BONKING/KELELAHAN AKUT.
- Jika HR naik > 5% tapi Speed/Power stabil -> VONIS: CARDIAC DRIFT (Dehidrasi/Fatigue).
- Jika Power rendah (<2.0 W/kg) tapi HR tinggi (Zona 3/4) -> VONIS: EFISIENSI BURUK (Aerobic Base Lemah).
`;
}

export async function analyzeActivity(request: AnalysisRequest): Promise<string> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze activity");
  }

  const data = await response.json();
  return data.content;
}

export { SYSTEM_PROMPT };
