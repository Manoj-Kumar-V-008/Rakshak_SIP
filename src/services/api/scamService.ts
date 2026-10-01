import { AnalysisResult, AnalysisResultSchema } from '../../types/analysis';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
const baseUrl = configuredUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
export class ScamServiceError extends Error {}

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl}/v1/analyze/text`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang: 'auto', source: 'paste' }), signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Analysis service returned ${response.status}.`);
    return AnalysisResultSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Analysis service did not respond within 8 seconds.');
    throw new ScamServiceError('Unable to reach the analysis service. Check the backend URL and Wi-Fi connection.');
  } finally { clearTimeout(timeout); }
};
