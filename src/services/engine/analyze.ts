import { AnalysisResult } from '../../types/analysis';
import { analyzeText, ScamServiceError } from '../api/scamService';
import { analyzeLocally } from './localEngine';

export type AnalysisVia = 'server' | 'offline';
export type AnalysisOutcome = { result: AnalysisResult; via: AnalysisVia };

export const analyze = async (text: string): Promise<AnalysisOutcome> => {
  try {
    return { result: await analyzeText(text), via: 'server' };
  } catch (error) {
    if (!(error instanceof ScamServiceError)) throw error;
    const result = analyzeLocally(text);
    return { result, via: 'offline' };
  }
};
