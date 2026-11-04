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

export type FileVia = 'server' | 'offline';

export interface FileAnalysisOutcome {
  result: FileAnalysisResponse;
  via: FileVia;
}

export const offlineFileCheck = (
  fileName: string,
  fileSizeBytes: number
): FileAnalysisResponse => {
  const lower = fileName.toLowerCase();
  const dangerousExts = ['.apk', '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.ipa', '.dmg', '.deb', '.rpm'];
  const suspiciousExts = ['.zip', '.rar', '.7z', '.docm', '.xlsm', '.iso', '.bin'];
  const safeExts = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.mp3', '.mp4', '.wav', '.docx', '.xlsx'];

  const ext = '.' + (lower.split('.').pop() || '');
  const reasons: string[] = [];
  let score = 0;

  if (dangerousExts.includes(ext)) {
    reasons.push('executable_or_untrusted_installer');
    score += 75;
  } else if (suspiciousExts.includes(ext)) {
    reasons.push('archive_or_macro_container');
    score += 40;
  } else if (safeExts.includes(ext)) {
    reasons.push('standard_document_format');
    score = 0;
  } else {
    reasons.push('unrecognized_file_extension');
    score += 25;
  }

  // Check for suspicious double extensions (e.g. invoice.pdf.apk or photo.jpg.exe)
  const parts = lower.split('.');
  if (parts.length > 2) {
    const secondToLast = '.' + parts[parts.length - 2];
    if (safeExts.includes(secondToLast) && (dangerousExts.includes(ext) || suspiciousExts.includes(ext))) {
      reasons.push('spoofed_double_extension');
      score += 30;
    }
  }

  if (fileSizeBytes > 50 * 1024 * 1024) {
    reasons.push('oversized_file');
    score += 10;
  }

  score = Math.min(100, score);
  const verdict: 'safe' | 'suspicious' | 'danger' = score >= 60 ? 'danger' : score >= 30 ? 'suspicious' : 'safe';

  return {
    analysisId: `offline-${Date.now()}`,
    fileName,
    fileSizeBytes,
    sha256: 'On-device hash inspection',
    verdict: {
      verdict,
      riskScore: score,
      reasons,
      reputation: null,
    },
    engine: { mode: 'offline-heuristic', version: '1.0.0' },
    trace: [
      { stage: 'inspect', ms: 1, detail: `File extension: ${ext} (${fileSizeBytes} bytes)` },
      { stage: 'score', ms: 1, detail: `${verdict.toUpperCase()} (${score}/100)` },
    ],
  };
};

export const analyzeFile = async (
  fileName: string,
  fileContentBase64: string,
  fileSizeBytes: number = 0
): Promise<FileAnalysisOutcome> => {
  const engineMode = useConfigStore.getState().engineMode;
  if (engineMode === 'offline') {
    return { result: offlineFileCheck(fileName, fileSizeBytes), via: 'offline' };
  }

  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
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
    const result = (await response.json()) as FileAnalysisResponse;
    return { result, via: 'server' };
  } catch (error) {
    // If backend unreachable or timed out, gracefully fallback to on-device heuristic scanning
    const offlineResult = offlineFileCheck(fileName, fileSizeBytes);
    return { result: offlineResult, via: 'offline' };
  } finally {
    clearTimeout(timeout);
  }
};
