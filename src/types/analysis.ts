import { z } from 'zod';

export const AnalysisResultSchema = z.object({
  analysisId: z.string(), displayText: z.string(), riskScore: z.number().min(0).max(100), level: z.enum(['safe', 'suspicious', 'danger']), scamTypeId: z.string(), scamType: z.string(), indicators: z.array(z.string()), remediationSteps: z.array(z.string()),
  subScores: z.object({ urgency: z.number(), impersonation: z.number(), coercion: z.number(), financialAsk: z.number() }),
  signals: z.array(z.object({ id: z.string(), label: z.string(), category: z.string(), weight: z.number(), matches: z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })) })),
  entities: z.object({ urls: z.array(z.string()), phones: z.array(z.string()), amounts: z.array(z.string()) }), detectedLanguage: z.string(), scores: z.object({ rules: z.number().nullable(), semantic: z.number().nullable(), fused: z.number().nullable() }), engine: z.object({ mode: z.enum(['rules-only', 'offline-rules']), rulesVersion: z.string(), latencyMs: z.number() }), trace: z.array(z.object({ stage: z.string(), ms: z.number(), detail: z.string() })),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
