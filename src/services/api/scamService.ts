import { AnalysisResult, AnalysisResultSchema } from '../../types/analysis';
import { useConfigStore } from '../../store/useConfigStore';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { getGeminiKey } from '../ai/geminiClient';

export class ScamServiceError extends Error {}

const baseUrlFor = (url: string) => url.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');

const TOKEN_KEY = 'rakshak_auth_token';

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    const geminiKey = await getGeminiKey();
    if (geminiKey) {
      (headers as Record<string, string>)['X-Gemini-API-Key'] = geminiKey;
    }
  } catch {
    // Ignore SecureStore errors.
  }
  return headers;
};

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  // 35s timeout to allow Render container wake-up and Gemini LLM latency
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${baseUrl}/v1/analyze/text`, { method: 'POST', headers, body: JSON.stringify({ text, lang: 'auto', source: 'paste' }), signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Analysis service returned ${response.status}.`);
    return AnalysisResultSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Analysis service did not respond within 35 seconds. Render free tier may be cold-starting; retry in a few seconds.');
    throw new ScamServiceError(`Unable to reach the analysis service at "${baseUrl}". Check your backend URL and internet connection.`);
  } finally { clearTimeout(timeout); }
};

export type FeedbackVerdict = 'scam_confirmed' | 'false_positive' | 'missed_scam';

export const sendFeedback = async (analysisId: string, verdict: FeedbackVerdict, text?: string): Promise<void> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${baseUrl}/v1/feedback`, { method: 'POST', headers, body: JSON.stringify({ analysisId, verdict, text }), signal: controller.signal });
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

  const geminiKey = await getGeminiKey();
  const uploadHeaders: Record<string, string> = {};
  if (geminiKey) uploadHeaders['X-Gemini-API-Key'] = geminiKey;
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;
  } catch { /* ignore */ }

  // NOTE: fetch() FormData file parts throw "Unsupported FormDataPart implementation"
  // on this SDK, so voice uses the native expo-file-system uploader instead.
  const upload = uploadAsync(`${baseUrl}/v1/analyze/audio`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mimeFor(fileName),
    headers: uploadHeaders,
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

export type HealthStatus = {
  status: string;
  engine: string;
  rulesVersion: string;
  llm?: string;
  semantic?: string;
  safeBrowsing?: string;
  virustotal?: string;
};

export const fetchRules = async (): Promise<unknown> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${baseUrl}/v1/rules`, { headers, signal: controller.signal });
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
  // 35s timeout to allow Render free tier container spin-up (cold starts can take 20-30s)
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${baseUrlFor(url)}/health`, { headers, signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Server returned HTTP ${response.status}.`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || !('status' in payload) || !('engine' in payload) || !('rulesVersion' in payload)) throw new ScamServiceError('Server returned an invalid health response.');
    const health = payload as HealthStatus;
    if (health.status !== 'ok') throw new ScamServiceError('Server is not ready.');
    return health;
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ScamServiceError('Connection timed out. If using Render free tier, the backend is waking up from sleep; please try again in 15 seconds.');
    }
    const cleanUrl = baseUrlFor(url);
    if (cleanUrl.includes('10.0.2.2')) {
      throw new ScamServiceError('10.0.2.2 is for Android Emulator only. On a physical phone, open Profile -> Demo Connection and enter your Render cloud URL or your laptop\'s Wi-Fi IP.');
    }
    throw new ScamServiceError(`Unable to reach backend at "${cleanUrl}". Please check internet connection, Wi-Fi, or update your URL in Demo Connection.`);
  } finally { clearTimeout(timeout); }
};

export type LinkVerdict = 'safe' | 'suspicious' | 'danger';

export interface UrlCheckResult {
  original: string;
  expanded: string | null;
  domain: string | null;
  scheme: string | null;
  isHttps: boolean;
  redirectChain: string[];
  verdict: LinkVerdict;
  riskScore: number;
  reasons: string[];
  reputation: { threatType: string; platformType: string; threatEntryType: string; cacheDuration?: string } | null;
}

export interface LinkAnalysisResponse {
  inputText: string;
  urls: UrlCheckResult[];
  overallVerdict: LinkVerdict;
  overallRiskScore: number;
  engine: { mode: string; version: string };
  trace: Array<{ stage: string; ms: number; detail: string }>;
}

export const verifyLink = async (text: string): Promise<LinkAnalysisResponse> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${baseUrl}/v1/analyze/link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!response.ok) throw new ScamServiceError(`Link verification returned ${response.status}.`);
    return (await response.json()) as LinkAnalysisResponse;
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Link verification timed out after 30 seconds.');
    throw new ScamServiceError('Unable to reach the link verification service. Check the backend URL and Wi-Fi connection.');
  } finally { clearTimeout(timeout); }
};

export interface ReportLinkRequest {
  originalUrl: string;
  expandedUrl: string | null;
  domain: string;
  reporterText: string | null;
}

export interface ReportLinkResponse {
  ok: boolean;
  id: number;
}

export interface ReportedLinkEntry {
  originalUrl: string;
  expandedUrl: string | null;
  domain: string;
  reporterText: string | null;
  createdAt: number;
}

export const reportScamLink = async (request: ReportLinkRequest): Promise<ReportLinkResponse> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl}/v1/report/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) throw new ScamServiceError(`Report link returned ${response.status}.`);
    return (await response.json()) as ReportLinkResponse;
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Report link timed out after 10 seconds.');
    throw new ScamServiceError('Unable to report link. Check the backend URL and Wi-Fi connection.');
  } finally { clearTimeout(timeout); }
};

export const fetchScamLinkBlocklist = async (): Promise<ReportedLinkEntry[]> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl}/v1/report/links`, { signal: controller.signal });
    if (!response.ok) throw new ScamServiceError(`Blocklist returned ${response.status}.`);
    return (await response.json()) as ReportedLinkEntry[];
  } catch (error) {
    if (error instanceof ScamServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ScamServiceError('Blocklist timed out after 8 seconds.');
    throw new ScamServiceError('Unable to fetch scam link blocklist.');
  } finally { clearTimeout(timeout); }
};
