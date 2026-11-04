import { useConfigStore } from '../../store/useConfigStore';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';

export class FileServiceError extends Error {}

const baseUrlFor = (url: string) => url.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');

const mimeFor = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'apk': return 'application/vnd.android.package-archive';
    case 'zip': return 'application/zip';
    case 'pdf': return 'application/pdf';
    case 'exe': return 'application/x-msdownload';
    case 'rar': return 'application/x-rar-compressed';
    default: return 'application/octet-stream';
  }
};

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
  fileUri: string,
  fileName: string,
  fileSizeBytes: number = 0
): Promise<FileAnalysisOutcome> => {
  const engineMode = useConfigStore.getState().engineMode;
  if (engineMode === 'offline') {
    return { result: offlineFileCheck(fileName, fileSizeBytes), via: 'offline' };
  }

  const baseUrl = baseUrlFor(useConfigStore.getState().backendUrl);
  try {
    const uploadPromise = uploadAsync(`${baseUrl}/v1/analyze/file`, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: mimeFor(fileName),
    }).then((response) => {
      if (response.status < 200 || response.status >= 300) {
        throw new FileServiceError(`File analysis returned ${response.status}. ${response.body.slice(0, 150)}`);
      }
      return JSON.parse(response.body) as FileAnalysisResponse;
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new FileServiceError('File analysis timed out after 30 seconds.')), 30_000)
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return { result, via: 'server' };
  } catch (error) {
    // If backend unreachable or timed out, gracefully fallback to on-device heuristic scanning
    const offlineResult = offlineFileCheck(fileName, fileSizeBytes);
    return { result: offlineResult, via: 'offline' };
  }
};
