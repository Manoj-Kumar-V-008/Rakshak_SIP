import { AnalysisResult } from '../../types/analysis';
import { analyzeText, ScamServiceError, type LinkAnalysisResponse, type LinkVerdict, verifyLink as verifyLinkApi } from '../api/scamService';
import { analyzeLocally } from './localEngine';
import { useConfigStore } from '../../store/useConfigStore';

export type AnalysisVia = 'server' | 'offline';
export type AnalysisOutcome = { result: AnalysisResult; via: AnalysisVia };

export const analyze = async (text: string): Promise<AnalysisOutcome> => {
  if (useConfigStore.getState().engineMode === 'offline') return { result: analyzeLocally(text), via: 'offline' };
  try {
    return { result: await analyzeText(text), via: 'server' };
  } catch (error) {
    if (!(error instanceof ScamServiceError)) throw error;
    const result = analyzeLocally(text);
    return { result, via: 'offline' };
  }
};

export type LinkVia = 'server' | 'offline';
export type LinkOutcome = { result: LinkAnalysisResponse; via: LinkVia };

export type { LinkAnalysisResponse, LinkVerdict };

const suspiciousTlds = ['.xyz', '.top', '.click', '.rest', '.loan', '.date', '.racing', '.win', '.review', '.download', '.gdn', '.tk'];
const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'tiny.cc', 'rebrand.ly', 'cutt.ly', 'ow.ly', 'is.gd', 'goo.gl'];

const extractUrls = (text: string): string[] => {
  const matches = text.match(/(?:https?:\/\/|www\.)[^\s<>]+/gi);
  return matches ?? [];
};

const offlineLinkCheck = (text: string): LinkAnalysisResponse => {
  const urls = extractUrls(text);
  const checks = urls.map((original: string) => {
    const expanded: string | null = null;
    let domain: string | null = null;
    let scheme: string | null = null;
    let isHttps = false;
    try {
      const u = new URL(original.startsWith('www.') ? `https://${original}` : original);
      domain = u.hostname.toLowerCase();
      scheme = u.protocol.replace(':', '');
      isHttps = u.protocol === 'https:';
    } catch { /* ignore */ }

    const reasons: string[] = [];
    let score = 0;
    if (!isHttps) { reasons.push('http_not_https'); score += 35; }
    const tld = domain ? '.' + domain.split('.').pop() : '';
    if (suspiciousTlds.includes(tld)) { reasons.push('suspicious_tld'); score += 30; }
    if (shorteners.some((s) => domain?.includes(s))) { reasons.push('url_shortener'); score += 25; }
    score = Math.min(score, 100);
    const verdict: LinkVerdict = score >= 60 ? 'danger' : score >= 30 ? 'suspicious' : 'safe';

    return {
      original,
      expanded,
      domain,
      scheme,
      isHttps,
      redirectChain: [original],
      verdict,
      riskScore: score,
      reasons,
      reputation: null,
    };
  });

  const overallScore = checks.length ? Math.max(...checks.map((c) => c.riskScore)) : 0;
  const overallVerdict: LinkVerdict = overallScore >= 60 ? 'danger' : overallScore >= 30 ? 'suspicious' : 'safe';

  return {
    inputText: text,
    urls: checks,
    overallVerdict,
    overallRiskScore: overallScore,
    engine: { mode: 'offline-link', version: '1.0.0' },
    trace: [{ stage: 'extract', ms: 0, detail: `${urls.length} url(s) found` }, { stage: 'score', ms: 0, detail: `overall ${overallVerdict} (${overallScore}/100)` }],
  };
};

export const verifyLink = async (text: string): Promise<LinkOutcome> => {
  try {
    return { result: await verifyLinkApi(text), via: 'server' };
  } catch (error) {
    if (!(error instanceof ScamServiceError)) throw error;
    const result = offlineLinkCheck(text);
    return { result, via: 'offline' };
  }
};
