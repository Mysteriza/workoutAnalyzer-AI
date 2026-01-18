import { AnalysisRequest, ChartDataPoint, UserProfile, StravaActivity } from "@/types";

const SYSTEM_PROMPT = `Anda adalah seorang Fisiolog Olahraga Elit dan Ahli Nutrisi Performa. Tugas Anda adalah memberikan analisis pasca-latihan yang kritis, objektif, dan berbasis data ilmiah. Tidak ada basa-basi. Langsung ke inti masalah.

PRINSIP ANALISIS:
- Gunakan data mentah untuk menghasilkan insight yang tajam
- Identifikasi kelemahan dan potensi risiko tanpa sungkan
- Berikan rekomendasi yang spesifik dan terukur
- Hindari penggunaan emoji atau ikon apapun
- Bahasa: Indonesia Formal, Tajam, Objektif

METODOLOGI:
1. Estimasi Max HR menggunakan rumus Tanaka: 208 - (0.7 x Usia)
2. Heart Rate Reserve (HRR) = Max HR - RHR
3. Zona Karvonen: Target HR = ((Max HR - RHR) x %Intensitas) + RHR

ZONA LATIHAN KARVONEN:
- Zona 1 (50-60% HRR): Recovery, pembakaran lemak ringan
- Zona 2 (60-70% HRR): Aerobic Base, efisiensi metabolik
- Zona 3 (70-80% HRR): Tempo, ambang laktat bawah
- Zona 4 (80-90% HRR): Threshold, ambang laktat atas
- Zona 5 (90-100% HRR): VO2max, kapasitas maksimal

PERTIMBANGAN BERDASARKAN JENIS AKTIVITAS:
- Bersepeda: Pertimbangkan jenis sepeda (MTB vs Road), terrain, power output, cadence optimal (80-100 rpm)
- Lari: Analisis pace, cadence (ideal 180 spm), ground contact time
- Hiking/Trekking: Fokus pada elevasi, beban carried, durasi istirahat
- Jalan Santai: Evaluasi sebagai aktivitas recovery atau low-intensity steady state

FORMAT OUTPUT (IKUTI STRUKTUR INI SECARA KETAT):

## RINGKASAN EKSEKUTIF
[Satu paragraf singkat tentang kualitas latihan secara keseluruhan, termasuk konteks gear/peralatan yang digunakan]

## ANALISIS ZONA JANTUNG DAN FISIOLOGI
- Estimasi Max HR (Tanaka): [nilai]
- Heart Rate Reserve: [nilai]
- Zona Dominan: [zona] dengan persentase waktu
- Efek Fisiologis: [penjelasan dampak pada sistem kardiovaskular]

## BEDAH PERFORMA
- Analisis Decoupling: Bandingkan performa paruh pertama vs kedua
  - Jika speed drop >10% dengan HR stabil/naik: tandai "BONKING/KELELAHAN GLIKOGEN"
  - Jika HR naik >5% dengan speed stabil: tandai "CARDIAC DRIFT"
- Efisiensi Mekanik: Faktor peralatan, terrain, teknik (untuk sepeda: cadence, power; untuk lari: pace consistency)
- Status Risiko: [LOW/MEDIUM/HIGH] dengan justifikasi

## PROTOKOL NUTRISI DAN PEMULIHAN
- Kebutuhan Karbohidrat: [gram] (target: 1-1.2g/kg BB dalam 30 menit)
- Kebutuhan Protein: [gram] (target: 0.3-0.4g/kg BB)
- Hidrasi: [ml] (perhitungan berdasarkan durasi dan intensitas)
- ALASAN ILMIAH: Jelaskan mekanisme replesi glikogen dan sintesis protein
- MENU KONKRET (Bahan Lokal Indonesia):
  - Opsi 1: [contoh makanan dengan gram]
  - Opsi 2: [contoh makanan dengan gram]

## RENCANA AKSI 24 JAM
- Status Besok: [REST/ACTIVE RECOVERY/LIGHT TRAINING]
- Rekomendasi Tidur: [jam] dengan alasan
- Stretching/Mobility: [area fokus berdasarkan jenis aktivitas]

## PERINGATAN KRITIS
[Jika ada indikasi overtraining, risiko cedera, atau anomali data - sebutkan dengan tegas]

DISCLAIMER:
"Analisis ini berdasarkan estimasi algoritma dan data yang tersedia. Bukan merupakan saran medis profesional. Konsultasikan dengan dokter untuk kondisi kesehatan tertentu."`;

export function buildAnalysisPrompt(
  activity: StravaActivity,
  streamSample: ChartDataPoint[],
  userProfile: UserProfile
): string {
  const hrMaxTanaka = Math.round(208 - (0.7 * userProfile.age));
  const hrr = hrMaxTanaka - userProfile.restingHeartRate;
  
  const hrData = streamSample.filter(d => d.heartrate !== undefined && d.heartrate > 0);
  const avgHr = hrData.length > 0
    ? Math.round(hrData.reduce((sum, d) => sum + (d.heartrate || 0), 0) / hrData.length)
    : activity.average_heartrate || 0;
  
  const maxHr = Math.max(
    ...streamSample.map(d => d.heartrate || 0).filter(h => h > 0),
    activity.max_heartrate || 0
  );
  
  const speedData = streamSample.filter(d => d.speed !== undefined && d.speed > 0);
  const avgSpeed = speedData.length > 0
    ? speedData.reduce((sum, d) => sum + (d.speed || 0), 0) / speedData.length
    : activity.average_speed;
  const maxSpeed = Math.max(
    ...streamSample.map(d => d.speed || 0),
    activity.max_speed || 0
  );

  const wattsData = streamSample.filter(d => d.watts !== undefined && d.watts > 0);
  const avgWatts = wattsData.length > 0
    ? Math.round(wattsData.reduce((sum, d) => sum + (d.watts || 0), 0) / wattsData.length)
    : activity.average_watts || 0;
  const maxWatts = Math.max(
    ...streamSample.map(d => d.watts || 0),
    activity.max_watts || 0
  );

  const cadenceData = streamSample.filter(d => d.cadence !== undefined && d.cadence > 0);
  const avgCadence = cadenceData.length > 0
    ? Math.round(cadenceData.reduce((sum, d) => sum + (d.cadence || 0), 0) / cadenceData.length)
    : activity.average_cadence || 0;

  const durationMinutes = Math.floor(activity.moving_time / 60);
  const durationHours = activity.moving_time / 3600;
  
  const calories = activity.calories || (activity.kilojoules 
    ? Math.round(activity.kilojoules * 0.239)
    : Math.round(durationHours * avgHr * 0.4 * userProfile.weight / 10));

  const midpoint = Math.floor(streamSample.length / 2);
  const firstHalf = streamSample.slice(0, midpoint);
  const secondHalf = streamSample.slice(midpoint);
  
  const speedFirstHalf = firstHalf.filter(d => d.speed !== undefined && d.speed > 0);
  const speedSecondHalf = secondHalf.filter(d => d.speed !== undefined && d.speed > 0);
  
  const avgSpeedFirstHalf = speedFirstHalf.length > 0
    ? speedFirstHalf.reduce((sum, d) => sum + (d.speed || 0), 0) / speedFirstHalf.length
    : 0;
  const avgSpeedSecondHalf = speedSecondHalf.length > 0
    ? speedSecondHalf.reduce((sum, d) => sum + (d.speed || 0), 0) / speedSecondHalf.length
    : 0;
  
  const hrFirstHalf = firstHalf.filter(d => d.heartrate !== undefined && d.heartrate > 0);
  const hrSecondHalf = secondHalf.filter(d => d.heartrate !== undefined && d.heartrate > 0);
  
  const avgHrFirstHalf = hrFirstHalf.length > 0
    ? Math.round(hrFirstHalf.reduce((sum, d) => sum + (d.heartrate || 0), 0) / hrFirstHalf.length)
    : 0;
  const avgHrSecondHalf = hrSecondHalf.length > 0
    ? Math.round(hrSecondHalf.reduce((sum, d) => sum + (d.heartrate || 0), 0) / hrSecondHalf.length)
    : 0;

  const speedDecoupling = avgSpeedFirstHalf > 0 && avgSpeedSecondHalf > 0
    ? ((avgSpeedFirstHalf - avgSpeedSecondHalf) / avgSpeedFirstHalf * 100).toFixed(1)
    : "N/A";
  const hrDrift = avgHrFirstHalf > 0 && avgHrSecondHalf > 0
    ? ((avgHrSecondHalf - avgHrFirstHalf) / avgHrFirstHalf * 100).toFixed(1)
    : "N/A";

  const formatPace = (speedMps: number): string => {
    if (speedMps <= 0) return "N/A";
    const paceSecondsPerKm = 1000 / speedMps;
    const minutes = Math.floor(paceSecondsPerKm / 60);
    const seconds = Math.floor(paceSecondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };

  const gearInfo = activity.gear 
    ? `${activity.gear.nickname || activity.gear.name}` 
    : "Tidak tersedia";

  const activityTypeInfo = getActivityTypeContext(activity.sport_type || activity.type);

  const prompt = `
KONTEKS PENGGUNA:
- Usia: ${userProfile.age} tahun
- Berat Badan: ${userProfile.weight} kg
- Tinggi Badan: ${userProfile.height} cm
- RHR (Detak Jantung Istirahat): ${userProfile.restingHeartRate} bpm
- Estimasi Max HR (Tanaka): ${hrMaxTanaka} bpm
- Heart Rate Reserve: ${hrr} bpm

DATA AKTIVITAS:
- Nama Aktivitas: ${activity.name}
- Jenis Aktivitas: ${activity.sport_type || activity.type} ${activityTypeInfo}
- Tanggal: ${new Date(activity.start_date_local).toLocaleString("id-ID")}
- Durasi: ${durationMinutes} menit (${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m)
- Jarak: ${(activity.distance / 1000).toFixed(2)} km
- Elevation Gain: ${activity.total_elevation_gain} m
- Elevation Range: ${activity.elev_low?.toFixed(0) || "?"} - ${activity.elev_high?.toFixed(0) || "?"} m
${activity.description ? `- Deskripsi: ${activity.description}` : ""}

PERALATAN/GEAR:
- ${activity.type === "Ride" ? "Sepeda" : activity.type === "Run" ? "Sepatu" : "Gear"}: ${gearInfo}

DATA HEART RATE:
- Avg HR: ${avgHr} bpm${hrr > 0 ? ` (${((avgHr - userProfile.restingHeartRate) / hrr * 100).toFixed(1)}% HRR)` : ""}
- Max HR: ${maxHr} bpm${hrr > 0 ? ` (${((maxHr - userProfile.restingHeartRate) / hrr * 100).toFixed(1)}% HRR)` : ""}

DATA SPEED:
- Avg Speed: ${(avgSpeed * 3.6).toFixed(2)} km/h
- Max Speed: ${(maxSpeed * 3.6).toFixed(2)} km/h
${activity.type === "Run" ? `- Avg Pace: ${formatPace(avgSpeed)}` : ""}

${avgWatts > 0 ? `DATA POWER:
- Avg Power: ${avgWatts} W
- Max Power: ${maxWatts} W
- Power/Weight: ${(avgWatts / userProfile.weight).toFixed(2)} W/kg
- Kilojoules: ${activity.kilojoules || Math.round(avgWatts * durationHours * 3.6)} kJ
` : ""}
${avgCadence > 0 ? `DATA CADENCE:
- Avg Cadence: ${avgCadence} ${activity.type === "Run" ? "spm" : "rpm"}
- Evaluasi: ${activity.type === "Ride" ? (avgCadence >= 80 && avgCadence <= 100 ? "Optimal" : avgCadence < 80 ? "Terlalu Rendah (grinding)" : "Tinggi (spinning)") : (avgCadence >= 170 && avgCadence <= 190 ? "Optimal" : avgCadence < 170 ? "Perlu ditingkatkan" : "Sangat baik")}
` : ""}
- Estimasi Kalori: ${calories} kkal
- Relative Effort (Suffer Score): ${activity.suffer_score || "N/A"}
${activity.achievement_count ? `- Achievements: ${activity.achievement_count}` : ""}
${activity.pr_count ? `- Personal Records: ${activity.pr_count}` : ""}

ANALISIS DECOUPLING (Paruh Pertama vs Kedua):
- Jumlah Data Points: ${streamSample.length}
- Avg Speed Paruh 1: ${(avgSpeedFirstHalf * 3.6).toFixed(2)} km/h
- Avg Speed Paruh 2: ${(avgSpeedSecondHalf * 3.6).toFixed(2)} km/h
- Speed Drop: ${speedDecoupling}%
- Avg HR Paruh 1: ${avgHrFirstHalf} bpm
- Avg HR Paruh 2: ${avgHrSecondHalf} bpm
- HR Drift: ${hrDrift}%

Berdasarkan data di atas, berikan analisis yang kritis, objektif, dan berbasis data sesuai format yang telah ditentukan.`;

  return prompt;
}

function getActivityTypeContext(type: string): string {
  const contexts: Record<string, string> = {
    "Ride": "(Bersepeda - pertimbangkan terrain, power output, dan cadence)",
    "Run": "(Lari - fokus pada pace consistency dan cadence)",
    "Walk": "(Jalan Santai - evaluasi sebagai low-intensity atau recovery)",
    "Hike": "(Hiking - perhatikan elevasi dan durasi)",
    "TrailRun": "(Trail Run - terrain teknis, elevasi signifikan)",
    "VirtualRide": "(Indoor Cycling - kondisi terkontrol)",
    "MountainBikeRide": "(MTB - terrain teknis, power bursts)",
    "GravelRide": "(Gravel - mixed terrain)",
  };
  return contexts[type] || "";
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
