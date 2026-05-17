import { z } from "zod";

export const activityIdSchema = z.object({
  activityId: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive()),
});

export const analysisRequestSchema = z.object({
  prompt: z.string().min(1).max(60000),
  systemInstruction: z.string().max(8000).optional(),
  activityId: z.number().int().positive(),
  forceRefresh: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1)),
  per_page: z
    .string()
    .default("30")
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(100)),
});

export const profileSchema = z.object({
  age: z.number().int().min(10).max(120),
  weight: z.number().min(30).max(250),
  height: z.number().min(100).max(250),
  restingHeartRate: z.number().int().min(30).max(200),
  preferredActivity: z.string().optional(),
});

export type ValidatedAnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type ValidatedProfile = z.infer<typeof profileSchema>;
