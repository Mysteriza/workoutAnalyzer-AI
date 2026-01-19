import { AnalysisRequest, APIAnalysisPayload, ChartDataPoint, UserProfile, StravaActivity } from "@/types";

const SYSTEM_PROMPT = `Anda adalah seorang "Performance Coach" berpengalaman yang suportif, analitis, dan edukatif.
Tugas Anda: Menganalisis data latihan (Sepeda, Jalan/Trekking, Lari, Hike, dll) secara mendalam, objektif, dan memberikan konteks "Sebab-Akibat".

FILOSOFI COACHING:
- **Konteks adalah Raja**: Pertimbangkan jenis aktivitas dan gear. Speed 15km/h itu lambat untuk Road Bike, tapi cepat untuk MTB di jalur offroad maupun onroad, dan mustahil untuk Hiking.
- **Suportif namun Jujur**: Jika performa turun, katakan. Tapi jelaskan penyebabnya (misal: "Salah pacing di awal") dan beri solusi.
- **Edukasi Awam**: Jelaskan istilah teknis. Jangan hanya bilang "Decoupling tinggi", tapi jelaskan "Jantung Anda kerja makin keras padahal speed makin pelan, tanda bensin habis".

STRUKTUR OUTPUT (JANGAN UBAH HEADER):

## RINGKASAN & QUALITY SCORE
[Berikan 1 paragraf ringkasan "big picture". Beri nilai kualitas sesi 1-10. Apakah tujuan sesi tercapai? Apakah gear yang digunakan (misal: MTB vs Road Bike) mempengaruhi hasil?]

## ANALISIS ZONA & DAMPAK TUBUH
- Max HR (Estimasi Tanaka): [Angka] bpm
- Max HR (Sesi Ini): [Angka] bpm (Jika tersedia)
- Heart Rate Reserve (HRR): [Angka] bpm
- Zona Dominan: Zona [X] ([Nama Zona])
- Penjelasan Awam: [Jelaskan efek fisiologis zona ini. Misal: "Zona pembakaran lemak" atau "Zona ambang laktat" dengan bahasa simpel].

## DETEKTIF PERFORMA
- **Konteks Gear & Medan**: [Analisis bagaimana sepeda/sepatu yang dipakai mempengaruhi speed/power. Apakah rutenya menanjak?].
- **Pacing & Stamina (Decoupling)**:
  - Data: Speed Drop [Angka]%, HR Drift [Angka]%.
  - Diagnosis: [Sebutkan apa yang terjadi. Misal: "Bonking", "Pacing Jempolan", atau "Kelelahan Otot"].
  - Penjelasan Sebab-Akibat: [Jelaskan alurnya. Cth: "(SEBAB) Karena Anda menekan terlalu keras di tanjakan awal, (AKIBAT) detak jantung drift naik di akhir sesi."].
- **Efisiensi Gerak**:
  - Cadence ([Angka] rpm): [Analisis putaran kaki. Jika rendah (<60rpm) dan beban berat -> boros otot. Jika tinggi -> boros napas tapi hemat otot. Hanya berlaku jika bersepeda dan datanya tersedia].

## PROTOKOL NUTRISI & RECOVERY (Menu Lokal)
- Karbohidrat: [Angka] gram.
- Protein: [Angka] gram.
- Hidrasi: [Angka] ml.
- Menu Rekomendasi (Indonesia):
  - Opsi 1: [Makanan simpel & enak]
  - Opsi 2: [Makanan simpel & enak]

## SARAN UNTUK SESI BERIKUTNYA
- Pacing Strategy: [Saran konkret].
- Gear/Teknik: [Saran penggunaan gear/stroke/cadence].
- Fokus Latihan: [Area perbaikan].

ATURAN TAMBAHAN:
1. Bahasa Indonesia yang luwes, enak dibaca, mengalir.
2. JANGAN pakai emoji.
4. JANGAN gunakan data dari "aktivitas sebelumnya". Fokus hanya pada data yang diberikan di atas.
5. Jika data (misal Power/Cadence, atau Heart Rate, dll) bernilai "N/A" atau 0, nyatakan bahwa data tidak tersedia (jangan halusinasi).
6. PENTING: Bedakan "Max HR (Tanaka)" (Teoritis User) vs "Max HR (Sesi Ini)" (Aktual).`;

export function buildAnalysisPrompt(
  activity: StravaActivity,
  streamSample: ChartDataPoint[],
  userProfile: UserProfile
): string {
  // 1. Kalkulasi Dasar
  const hrMaxTanaka = Math.round(208 - (0.7 * userProfile.age));
  const hrr = hrMaxTanaka - userProfile.restingHeartRate;
  
  // 2. Data Preparation
  // Prioritize Strava Summary fields for accuracy, fallback to stream calculation
  const validHr = streamSample.filter(d => d.heartrate && d.heartrate > 0).map(d => d.heartrate!);
  const avgHr = activity.average_heartrate || (validHr.length ? Math.round(validHr.reduce((a, b) => a + b, 0) / validHr.length) : 0);
  
  const validSpeed = streamSample.filter(d => d.speed && d.speed > 0).map(d => d.speed!);
  const avgSpeed = activity.average_speed || (validSpeed.length ? validSpeed.reduce((a, b) => a + b, 0) / validSpeed.length : 0);
  
  const validWatts = streamSample.filter(d => d.watts && d.watts > 0).map(d => d.watts!);
  const avgWatts = activity.average_watts || (validWatts.length ? Math.round(validWatts.reduce((a, b) => a + b, 0) / validWatts.length) : 0);
  
  const validCadence = streamSample.filter(d => d.cadence && d.cadence > 0).map(d => d.cadence!);
  const avgCadence = activity.average_cadence || (validCadence.length ? Math.round(validCadence.reduce((a, b) => a + b, 0) / validCadence.length) : 0);

  // 3. Robust Decoupling Analysis
  let decouplingText = "Data tidak cukup untuk analisis decoupling yang akurat.";
  let speedDropStr = "N/A";
  let hrDriftStr = "N/A";

  if (streamSample.length >= 60) { // Minimal data points
    const midpoint = Math.floor(streamSample.length / 2);
    const part1 = streamSample.slice(0, midpoint);
    const part2 = streamSample.slice(midpoint);

    const getPartAvg = (arr: ChartDataPoint[], key: keyof ChartDataPoint) => {
      const vals = arr.map(d => d[key]).filter((v): v is number => typeof v === 'number' && v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const avgSpeed1 = getPartAvg(part1, 'speed');
    const avgSpeed2 = getPartAvg(part2, 'speed');
    const avgHr1 = getPartAvg(part1, 'heartrate');
    const avgHr2 = getPartAvg(part2, 'heartrate');

    if (avgSpeed1 > 0 && avgHr1 > 0) {
      const speedDrop = ((avgSpeed2 - avgSpeed1) / avgSpeed1) * 100;
      const hrDrift = ((avgHr2 - avgHr1) / avgHr1) * 100;
      
      speedDropStr = `${speedDrop.toFixed(1)}%`;
      hrDriftStr = `${hrDrift.toFixed(1)}%`;
      
      decouplingText = `
- Speed Awal: ${(avgSpeed1 * 3.6).toFixed(1)} km/h -> Akhir: ${(avgSpeed2 * 3.6).toFixed(1)} km/h
- HR Awal: ${Math.round(avgHr1)} bpm -> Akhir: ${Math.round(avgHr2)} bpm
- CHANGE SPEED: ${speedDropStr} (Negatif = Drop)
- CHANGE HR: ${hrDriftStr} (Positif = Drift)
      `.trim();
    }
  }

  // 4. Konteks
  const durationMin = Math.floor(activity.moving_time / 60);
  const gearName = activity.gear ? (activity.gear.nickname || activity.gear.name) : "Tidak ada gear khusus";
  const wKg = avgWatts > 0 ? (avgWatts / userProfile.weight).toFixed(2) : "-";

  // 5. Terminology Helper
  const getTerms = (type: string) => {
    switch (type) {
      case "Run": return { verb: "lari", noun: "pelari", action: "berlari" };
      case "Ride": return { verb: "bersepeda/gowes", noun: "pesepeda", action: "mengayuh" };
      case "Walk": return { verb: "jalan kaki", noun: "pejalan kaki", action: "berjalan" };
      case "Hike": return { verb: "hiking", noun: "pendaki", action: "mendaki" };
      case "Swim": return { verb: "renang", noun: "perenang", action: "berenang" };
      default: return { verb: "berolahraga", noun: "atlet", action: "bergerak" };
    }
  };

  const terms = getTerms(activity.type);

  return `
${SYSTEM_PROMPT}

PROFIL PENGGUNA:
- Usia: ${userProfile.age} | Berat: ${userProfile.weight} kg
- RHR: ${userProfile.restingHeartRate} bpm | Max HR (Est): ${hrMaxTanaka} bpm

DATA SESI (${activity.type} - ${activity.sport_type}):
- Nama: ${activity.name}
- Durasi: ${durationMin} menit
- Jarak: ${(activity.distance / 1000).toFixed(2)} km
- Elevasi: ${activity.total_elevation_gain} m
- Gear/Sepeda/Sepatu: ${gearName}
- HR Max (Sesi Ini): ${activity.max_heartrate || "N/A"} bpm

METRIK RATA-RATA:
- HR: ${avgHr > 0 ? avgHr + " bpm" : "N/A"} (${avgHr > 0 ? ((avgHr - userProfile.restingHeartRate)/hrr*100).toFixed(0) + "% HRR" : "-"})
- Speed: ${avgSpeed > 0 ? (avgSpeed * 3.6).toFixed(1) + " km/h" : "N/A"}
- Power: ${avgWatts > 0 ? avgWatts + " W (" + wKg + " W/kg)" : "N/A"}
- Cadence: ${avgCadence > 0 ? avgCadence + " rpm" : "N/A"}

DATA DECOUPLING (Paruh Awal vs Akhir):
${decouplingText}

CATATAN KHUSUS UNTUK AI (PENTING):
1. KONTEKS AKTIVITAS: Ini adalah aktivitas **${activity.type}** (${terms.verb}). Gunakan istilah yang relevan (misal: "${terms.action}", "${terms.noun}"). JANGAN gunakan istilah "jalan kaki" jika ini "bersepeda", dan sebaliknya.
2. ANALISIS SPEED: Kecepatan rata-rata ${(avgSpeed * 3.6).toFixed(1)} km/h harus dinilai berdasarkan standar ${terms.noun}. 
3. DIAGNOSIS PESIMIS: Jika Speed Drop > 10% dan HR naik/tetap, diagnosa sebagai "Fatigue/Bonking".
4. DIAGNOSIS DEHIDRASI: Jika HR Drift > 5% dengan speed stabil, diagnosa sebagai "Cardiac Drift".
5. KONTEKS GEAR: Pertimbangkan "${gearName}". Sesuaikan ekspektasi performance dengan alat yang digunakan.
`;
}

export async function analyzeActivity(request: AnalysisRequest): Promise<string> {
  const prompt = buildAnalysisPrompt(request.activity, request.streamSample, request.userProfile);
  
  const payload: APIAnalysisPayload = {
    prompt,
    activityId: request.activity.id,
    forceRefresh: request.forceRefresh,
  };

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Gagal menganalisis aktivitas");
  }

  const data = await response.json();
  return data.content;
}

export { SYSTEM_PROMPT };
