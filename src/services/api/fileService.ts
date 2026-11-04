import { useConfigStore } from '../../store/useConfigStore';

export class FileServiceError extends Error {}

const baseUrlFor = (url: string) => url.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');

export interface FileVerdict {
  verdict: 'safe' | 'suspicious' | 'danger' | 'unknown';
  riskScore: number;
  reasons: string[];
  reputation: { [key: string]: unknown } | null;
}

export interface FileAnalysisResponse {
  analysisId: string;
  fileName: string;
  fileSizeBytes: number;
  sha256: string;
  verdict: FileVerdict;
  engine: { mode: string; version: string };
  trace: Array<{ stage: string; ms: number; detail: string }>;
}

export const analyzeFile = async (
  fileName: string,
  fileContentBase64: string
): Promise<FileAnalysisResponse> => {
  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${baseUrl}/v1/analyze/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileContentBase64,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new FileServiceError(`File analysis returned ${response.status}.`);
    return (await response.json()) as FileAnalysisResponse;
  } catch (error) {
    if (error instanceof FileServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError')
      throw new FileServiceError('File analysis timed out after 30 seconds.');
    throw new FileServiceError('Unable to reach the file analysis service. Check the backend URL and Wi-Fi connection.');
  } finally { clearTimeout(timeout); }
};
