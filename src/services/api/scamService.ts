import { AnalysisResult, AnalysisResultSchema } from '../../types/analysis';
import { useConfigStore } from '../../store/useConfigStore';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

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

export type FeedbackVerdict = 'scam_confirmed' | 'false_positive' | 'missed_scam';

export const sendFeedback = async (analysisId: string, verdict: FeedbackVerdict, text?: string): Promise<void> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl}/v1/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysisId, verdict, text }), signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Feedback service returned ${response.status}.`);
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Feedback service did not respond within 8 seconds.');
    throw new ScamServiceError('Unable to reach the feedback service. Your report was not saved on the server.');
  } finally { clearTimeout(timeout); }
};

const mimeFor = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'webm') return 'audio/webm';
  return 'audio/m4a';
};

export const analyzeAudio = async (uri: string, fileName = 'clip.m4a'): Promise<AnalysisResult> => {
  const backendUrl = useConfigStore.getState().backendUrl;
  const baseUrl = baseUrlFor(backendUrl);
  // Preflight: distinguish "server unreachable" from "upload problem".
  try {
    await checkHealth(backendUrl);
  } catch (error) {
    throw new ScamServiceError(`Server unreachable (${error instanceof Error ? error.message : 'no detail'}). Fix Test connection first.`);
  }
  // NOTE: fetch() FormData file parts throw "Unsupported FormDataPart implementation"
  // on this SDK, so voice uses the native expo-file-system uploader instead.
  const upload = uploadAsync(`${baseUrl}/v1/analyze/audio`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mimeFor(fileName),
  }).then((result) => {
    if (result.status === 503) throw new ScamServiceError('Voice transcription is not ready on the server. Either pip install faster-whisper and pre-run once, or set a Gemini key (RAKSHAK_LLM_PROVIDER=gemini) for cloud transcription.');
    if (result.status === 415) throw new ScamServiceError('Unsupported audio type. Use m4a/wav/mp3.');
    if (result.status === 404) throw new ScamServiceError('Backend has no voice endpoint. Restart it with the latest code.');
    if (result.status < 200 || result.status >= 300) throw new ScamServiceError(`Voice analysis returned ${result.status}. ${result.body.slice(0, 200)}`);
    return AnalysisResultSchema.parse(JSON.parse(result.body));
  });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new ScamServiceError('Voice analysis timed out after 60 seconds. Keep clips under 20 seconds.')), 60_000));
  return Promise.race([upload, timeout]);
};

export type HealthStatus = { status: string; engine: string; rulesVersion: string };

export const fetchRules = async (): Promise<unknown> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${baseUrl}/v1/rules`, { signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Rules service returned ${response.status}.`);
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Rules refresh timed out after 5 seconds.');
    throw new ScamServiceError('Unable to reach the rules service. Using bundled rules.');
  } finally { clearTimeout(timeout); }
};

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
