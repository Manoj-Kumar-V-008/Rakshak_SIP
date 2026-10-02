import { AnalysisResult, AnalysisResultSchema } from '../../types/analysis';
import { useConfigStore } from '../../store/useConfigStore';

export class ScamServiceError extends Error {}

const baseUrlFor = (url: string) => url.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
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

export type HealthStatus = { status: string; engine: string; rulesVersion: string };

export const checkHealth = async (url: string): Promise<HealthStatus> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${baseUrlFor(url)}/health`, { signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Server returned ${response.status}.`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || !('status' in payload) || !('engine' in payload) || !('rulesVersion' in payload)) throw new ScamServiceError('Server returned an invalid health response.');
    const health = payload as HealthStatus;
    if (health.status !== 'ok') throw new ScamServiceError('Server is not ready.');
    return health;
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Connection timed out after 5 seconds.');
    throw new ScamServiceError('Unable to reach the server. Check the URL, Wi-Fi/hotspot, and firewall.');
  } finally { clearTimeout(timeout); }
};
