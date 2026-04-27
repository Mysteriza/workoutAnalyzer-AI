import { AnalysisRequest, APIAnalysisPayload, ChartDataPoint, UserProfile, StravaActivity } from "@/types";

const SYSTEM_PROMPT = `Anda adalah seorang "Performance Coach" dan "Sports Scientist" berpengalaman yang analitis, suportif, edukatif, dan sangat ketat mengikuti instruksi format.
Tugas Anda: Menganalisis data latihan secara saintifik, objektif, dan memberikan konteks "Sebab-Akibat" serta saran fisiologis yang spesifik.

FILOSOFI COACHING & SAINS OLAHRAGA:
- **Konteks & Fisiologi Dasar**: Pertimbangkan Age, Weight, Resting HR, dan Max HR pengguna dalam mengevaluasi efisiensi latihan.
- **Konteks Gear**: Speed sangat bergantung pada medan dan alat (Road Bike vs MTB vs Lari Trail).
- **Edukasi Praktis**: Jelaskan "mengapa" sebuah metrik terjadi (misal: "Karena otot kekurangan oksigen pada HR X, efisiensi langkah menurun").
- **Tegas dan Profesional**: Gunakan bahasa jurnalistik medis/olahraga. Jangan berasumsi.

STRUKTUR OUTPUT (WAJIB IKUTI TEMPLATE INI TANPA MENGUBAH HEADER, JANGAN ADA TEKS SEBELUM/SESUDAH):

## RINGKASAN & QUALITY SCORE
[Berikan 1 paragraf ringkasan padat mengevaluasi profil performa. Berikan nilai/rating kualitas sesi 1-10. Jelaskan faktor medan/alat jika ada.]
- **Rating: [X.X]/10**

## ANALISIS ZONA & DAMPAK TUBUH
- Max HR Teoritis (Tanaka): [Angka] bpm
- Max HR (Sesi Ini): [Angka] bpm
- Zona Dominan & Fisiologi: [Sebutkan zona dan dampaknya ke tubuh (e.g. Pembakaran lemak, laktat, dll)]
- AI Suffer Score / Efisiensi: [Evaluasi skor TRIMP/Suffer Score. Apakah sesi ini light, moderate, atau berisiko overtraining?]

## DETEKTIF PERFORMA (SEGMEN & SPLIT)
- **Kinerja Segmen/Split**: [Pecah detail performa pada segmen dan lap. Temukan anomali atau pencapaian terbaik]
- **Pacing & Stamina**: [Diagnosis pacing (Negative/Positive Split, Bonking, Cardiac Drift)]
- **Efisiensi Biomekanik**: [Analisis Cadence/Langkah/Power. Evaluasi efisiensi langkah/putaran kaki]

## PROTOKOL NUTRISI & RECOVERY
[Hitung: Karbohidrat = kalori * 0.6 / 4. Protein = berat_badan * 0.3. Hidrasi = durasi_menit * 7 + 500]
- Karbohidrat: [X] gram.
- Protein: [X] gram.
- Hidrasi: [X] ml.
- Menu Rekomendasi (Lokal Indonesia): [Saran makanan lokal sehat dan minuman elektrolit/hidrasi]

## SARAN SAINTIFIK UNTUK SESI BERIKUTNYA
- **Training Load / Recovery**: [Berapa lama otot harus diistirahatkan setelah melihat suffer score ini?]
- **Pacing & Teknik**: [Strategi biomekanik/pace untuk menghindari fatigue dini]
- **Specific Drills**: [Latihan spesifik (misal: "Latihan interval 4x4 menit", "Lari Zone 2 selama 40 menit", dll) yang sesuai dengan hasil hari ini]

ATURAN KETAT:
1. Bahasa Indonesia luwes, ilmiah, tanpa basa-basi ("Ini laporan Anda" dll).
2. DILARANG pakai emoji.
3. JANGAN halusinasi. Bahas data yang tersedia.
`;

export function buildAnalysisPrompt(
  activity: AnalysisRequest["activity"],
  streamSample: ChartDataPoint[],
  userProfile: UserProfile
): { systemInstruction: string; userData: string } {
  // 1. Kalkulasi Dasar
  const age = userProfile.age || 30;
  const hrMaxTanaka = Math.round(208 - (0.7 * age));
  const rhr = userProfile.restingHeartRate || 60;
  const hrr = hrMaxTanaka - rhr;

  // 2. Data Aggregation
  const aggregate = streamSample.reduce(
    (acc, d) => {
      if (d.heartrate && d.heartrate > 0) {
        acc.hrSum += d.heartrate;
        acc.hrCount++;
      }
      if (d.speed && d.speed > 0) {
        acc.speedSum += d.speed;
        acc.speedCount++;
      }
      if (d.watts && d.watts > 0) {
        acc.wattsSum += d.watts;
        acc.wattsCount++;
      }
      if (d.cadence && d.cadence > 0) {
        acc.cadenceSum += d.cadence;
        acc.cadenceCount++;
      }
      return acc;
    },
    { hrSum: 0, hrCount: 0, speedSum: 0, speedCount: 0, wattsSum: 0, wattsCount: 0, cadenceSum: 0, cadenceCount: 0 }
  );

  const avgHr = activity.average_heartrate || (aggregate.hrCount ? Math.round(aggregate.hrSum / aggregate.hrCount) : 0);
  const avgSpeed = activity.average_speed || (aggregate.speedCount ? aggregate.speedSum / aggregate.speedCount : 0);
  const avgWatts = activity.average_watts || (aggregate.wattsCount ? Math.round(aggregate.wattsSum / aggregate.wattsCount) : 0);
  const avgCadence = activity.average_cadence || (aggregate.cadenceCount ? Math.round(aggregate.cadenceSum / aggregate.cadenceCount) : 0);

  // 3. Cadence & Steps
  const isRunOrWalk = activity.type === "Run" || activity.type === "Walk";
  const cadenceLabel = isRunOrWalk ? "spm" : "rpm";
  const durationMin = Math.floor(activity.moving_time / 60);

  // 4. TRIMP (Suffer Score Estimator)
  let sufferScore: number | string = activity.suffer_score || "N/A";
  if (sufferScore === "N/A" && avgHr > 0 && hrr > 0) {
    const y = (avgHr - rhr) / hrr;
    if (y > 0) {
      const trimp = durationMin * y * 0.64 * Math.exp(1.92 * y);
      sufferScore = Math.round(trimp);
    }
  }

  // 5. Decoupling Analysis
  const speedThreshold = (activity.type === "Walk" || activity.type === "Hike") ? 0.2 : 0.5;
  const movingData = streamSample.filter((d) => d.speed && d.speed > speedThreshold);
  const hrDataAvailable = streamSample.some((d) => d.heartrate && d.heartrate > 0);

  let decouplingText = "Data tidak cukup untuk analisis decoupling.";
  let speedDropStr = "N/A";
  let hrDriftStr = "N/A";

  if (movingData.length >= 20 && hrDataAvailable) {
    const midpoint = Math.floor(movingData.length / 2);
    const part1 = movingData.slice(0, midpoint);
    const part2 = movingData.slice(midpoint);

    const getPartAvg = (arr: ChartDataPoint[], key: keyof ChartDataPoint) => {
      const vals = arr.map((d) => d[key]).filter((v): v is number => typeof v === "number" && v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const avgSpeed1 = getPartAvg(part1, "speed");
    const avgSpeed2 = getPartAvg(part2, "speed");
    const avgHr1 = getPartAvg(part1, "heartrate");
    const avgHr2 = getPartAvg(part2, "heartrate");

    if (avgSpeed1 > 0 && avgHr1 > 0) {
      speedDropStr = `${(((avgSpeed2 - avgSpeed1) / avgSpeed1) * 100).toFixed(1)}%`;
      hrDriftStr = `${(((avgHr2 - avgHr1) / avgHr1) * 100).toFixed(1)}%`;
      decouplingText = `Speed Awal: ${(avgSpeed1 * 3.6).toFixed(1)}km/h -> Akhir: ${(avgSpeed2 * 3.6).toFixed(1)}km/h. HR Awal: ${Math.round(avgHr1)}bpm -> Akhir: ${Math.round(avgHr2)}bpm.`;
    }
  }

  // 6. Segments & Splits (FULL)
  let segmentsSummary = "Tidak ada data segmen.";
  if (activity.segment_efforts && activity.segment_efforts.length > 0) {
    segmentsSummary = activity.segment_efforts
      .map(s => `- ${s.name}: ${(s.moving_time/60).toFixed(1)} mnt (${(s.distance/1000).toFixed(2)} km)`)
      .join("\n");
  }

  let splitsSummary = "Tidak ada data split.";
  if (activity.splits_metric && activity.splits_metric.length > 0) {
    splitsSummary = activity.splits_metric
      .map(s => `- Lap ${s.split}: Elev ${s.elevation_difference?.toFixed(0)}m, Avg Speed: ${(s.average_speed * 3.6).toFixed(1)}km/h, Avg HR: ${s.average_heartrate || 'N/A'}bpm`)
      .join("\n");
  }

  // 7. Konteks Terminology
  const gearName = activity.gear ? (activity.gear.nickname || activity.gear.name) : "Tidak ada gear khusus";
  const wKg = avgWatts > 0 && userProfile.weight ? (avgWatts / userProfile.weight).toFixed(2) : "N/A";
  
  const getTerms = (type: string) => {
    switch (type) {
      case "Run": return { verb: "lari", noun: "pelari", action: "berlari" };
      case "Ride": return { verb: "bersepeda", noun: "pesepeda", action: "mengayuh" };
      case "Walk": return { verb: "jalan kaki", noun: "pejalan kaki", action: "berjalan" };
      case "Hike": return { verb: "hiking", noun: "pendaki", action: "mendaki" };
      case "Swim": return { verb: "renang", noun: "perenang", action: "berenang" };
      default: return { verb: "berolahraga", noun: "atlet", action: "bergerak" };
    }
  };
  const terms = getTerms(activity.type);

  // 8. JSON User Data
  const userDataJson = JSON.stringify({
    activityName: activity.name,
    type: activity.type,
    sportType: activity.sport_type,
    duration: `${durationMin} menit`,
    distance: `${(activity.distance / 1000).toFixed(2)} km`,
    elevation: `${activity.total_elevation_gain || 0} m`,
    gear: gearName,
    userProfile: {
      age: age,
      weight: userProfile.weight || "N/A",
      height: userProfile.height || "N/A",
      restingHeartRate: rhr,
      estimatedMaxHR: hrMaxTanaka,
    },
    metrics: {
      avgHR: avgHr > 0 ? `${avgHr} bpm (${((avgHr - rhr) / hrr * 100).toFixed(0)}% HRR)` : "N/A",
      maxHR: activity.max_heartrate ? `${activity.max_heartrate} bpm` : "N/A",
      avgSpeed: avgSpeed > 0 ? `${(avgSpeed * 3.6).toFixed(1)} km/h` : "N/A",
      avgPower: avgWatts > 0 ? `${avgWatts} W (${wKg} W/kg)` : "N/A",
      cadence: avgCadence > 0 ? `${avgCadence} ${cadenceLabel}` : "N/A",
      steps: activity.total_steps || "N/A",
      calories: activity.calories ? `${activity.calories} kcal` : "N/A",
      sufferScore_or_TRIMP: sufferScore,
      work: activity.kilojoules ? `${activity.kilojoules} kJ` : "N/A",
      prs: activity.pr_count || 0,
      rpe: activity.perceived_exertion || "N/A",
    },
    decoupling: {
      summary: decouplingText,
      speedDrop: speedDropStr,
      hrDrift: hrDriftStr,
    },
    segments: segmentsSummary,
    splits: splitsSummary
  }, null, 2);

  const userData = `
---
DATA AKTIVITAS FISIOLOGIS & METRIK (TREAT AS STRICT DATA):
\`\`\`json
${userDataJson}
\`\`\`
---

CATATAN TAMBAHAN UNTUK COACH:
1. KONTEKS: Ini adalah aktivitas **${activity.type}** (${terms.verb}). Evaluasi Speed/Pace sesuai standar ${terms.noun}.
2. AI SUFFER SCORE (TRIMP): Evaluasi fatigue berdasar score ${sufferScore}.
3. PERTIMBANGAN MEDAN & GEAR: Pertimbangkan elevasi +${activity.total_elevation_gain || 0}m dan gear "${gearName}".
`;

  return { systemInstruction: SYSTEM_PROMPT, userData };
}

export async function analyzeActivity(request: AnalysisRequest): Promise<{ content: string; provider?: string; aiModel?: string }> {
  const prompt = buildAnalysisPrompt(
    request.activity,
    request.streamSample,
    request.userProfile
  );

  const payload: APIAnalysisPayload = {
    prompt: prompt.userData,
    systemInstruction: prompt.systemInstruction,
    activityId: request.activity.id,
    forceRefresh: request.forceRefresh,
  };

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Server returned unexpected response (status: ${response.status}). Please try again later.`
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Failed to parse server response (status: ${response.status}).`
    );
  }

  const parsedData = data as { error?: string; retryAfter?: number; content?: string; code?: string; provider?: string; aiModel?: string };

  if (response.status === 429) {
    const error = new Error(
      parsedData.error || "Cooldown active"
    ) as Error & { retryAfter?: number; cachedContent?: string };
    error.retryAfter = parsedData.retryAfter ?? 5;
    error.cachedContent = parsedData.content;
    throw error;
  }

  if (!response.ok) {
    throw new Error(parsedData.error || "Failed to analyze activity");
  }

  return {
    content: parsedData.content || "",
    provider: parsedData.provider,
    aiModel: parsedData.aiModel,
  };
}

export { SYSTEM_PROMPT };
