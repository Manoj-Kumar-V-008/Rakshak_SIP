import rules from '../../../shared/rules.json';
import { AnalysisResult } from '../../types/analysis';

type RuleSignal = (typeof rules.signals)[number];
type Category = 'urgency' | 'impersonation' | 'coercion' | 'financial' | 'link';

const typeDetails: Record<string, { name: string; steps: string[] }> = {
  digital_arrest: { name: 'Digital Arrest Scam', steps: ['Disconnect immediately; real police do not investigate over a video call.', 'Call 1930 to report the attempt.'] },
  credential_phishing: { name: 'Credential Phishing', steps: ['Do not share OTP, PIN, CVV, or passwords.', 'Contact the organisation using its official website or number.'] },
  utility_disconnection: { name: 'Utility Disconnection Fraud', steps: ['Do not call the number in the message.', "Verify your bill through the utility's official channel."] },
  lottery_prize: { name: 'Lottery or Prize Scam', steps: ['Do not pay a fee to claim a prize.', 'Block and report the sender.'] },
  fake_job: { name: 'Fake Job Scam', steps: ['Do not pay deposits for online tasks or jobs.', 'Verify employers through official channels.'] },
  investment_fraud: { name: 'Investment Fraud', steps: ['Do not transfer money for guaranteed returns.', 'Use a registered financial adviser before investing.'] },
  loan_harassment: { name: 'Loan Harassment Scam', steps: ['Do not be pressured into payment through an unknown contact.', 'Contact your lender through its official support channel.'] },
  malicious_app_or_hijack: { name: 'Malicious App or Call Hijack', steps: ['Do not install the app or dial the code.', 'Disconnect and contact your telecom provider if you already acted.'] },
  suspicious_link: { name: 'Suspicious Link', steps: ['Do not open or forward an unfamiliar shortened link.', 'Verify the sender before taking action.'] },
  unverified: { name: 'No Strong Scam Signals', steps: ['No high-risk pattern was found.', 'Continue to avoid sharing credentials with unverified contacts.'] },
};

const typeSignals: Record<string, string[]> = {
  digital_arrest: ['authority_impersonation', 'legal_threat', 'secrecy_isolation'], credential_phishing: ['credential_request'], utility_disconnection: ['utility_disconnect'], lottery_prize: ['prize_claim'], fake_job: ['task_job_offer'], investment_fraud: ['investment_guarantee'], loan_harassment: ['loan_harassment'], malicious_app_or_hijack: ['malicious_app'], suspicious_link: ['shortened_link'],
};

const normalize = (text: string) => text.normalize('NFKC').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
const languageFor = (text: string) => /[\u0900-\u097f]/.test(text) ? 'hi' : /[\u0c80-\u0cff]/.test(text) ? 'kn' : /\b(aap|hai|hain|turant|paise|karo|mat)\b/i.test(text) ? 'hinglish' : 'en';
const entitiesFor = (text: string) => ({
  urls: text.match(/(?:https?:\/\/|www\.)[^\s<>]+/gi) ?? [],
  phones: text.match(/(?<!\d)(?:\+91[- ]?)?[6-9]\d{9}(?!\d)/g) ?? [],
  amounts: text.match(/(?:₹|Rs\.?|INR)\s?\d[\d,]*(?:\.\d{1,2})?/gi) ?? [],
});

const matchesFor = (pattern: string, text: string) => {
  const regex = new RegExp(pattern, 'gi');
  const matches: Array<{ start: number; end: number; text: string }> = [];
  let match = regex.exec(text);
  while (match) { matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] }); match = regex.exec(text); }
  return matches;
};

const scoreFor = (signals: Array<{ weight: number }>) => signals.length === 0 ? 0 : Math.round((1 - signals.reduce((product, signal) => product * (1 - signal.weight), 1)) * 100);

const typeFor = (signals: Array<{ id: string; weight: number }>) => {
  const ids = new Set(signals.map((signal) => signal.id));
  if (ids.has('authority_impersonation') && ids.has('legal_threat')) return 'digital_arrest';
  return Object.entries(typeSignals).reduce((best, [typeId, idsForType]) => {
    const score = signals.filter((signal) => idsForType.includes(signal.id)).reduce((total, signal) => total + signal.weight, 0);
    return score > best.score ? { typeId, score } : best;
  }, { typeId: 'unverified', score: 0 }).typeId;
};

export const analyzeLocally = (input: string): AnalysisResult => {
  const started = Date.now();
  const displayText = normalize(input);
  let signals = rules.signals.flatMap((definition: RuleSignal) => {
    const matches = definition.patterns.flatMap((pattern) => matchesFor(pattern, displayText));
    return matches.length ? [{ id: definition.id, label: definition.label, category: definition.category as Category, weight: definition.weight, matches }] : [];
  });
  const benign = rules.benignPatterns.some((pattern) => new RegExp(pattern, 'i').test(displayText));
  let riskScore = scoreFor(signals);
  if (benign) { riskScore = Math.min(riskScore, 10); signals = []; }
  const scamTypeId = typeFor(signals);
  const subScore = (category: Category) => Math.min(100, Math.round(signals.filter((signal) => signal.category === category).reduce((total, signal) => total + signal.weight, 0) * 100));
  const latencyMs = Date.now() - started;
  const level = riskScore <= 20 ? 'safe' : riskScore <= 60 ? 'suspicious' : 'danger';
  const details = typeDetails[scamTypeId];
  return {
    analysisId: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, displayText, riskScore, level, scamTypeId, scamType: details.name,
    indicators: signals.length ? signals.map((signal) => signal.label) : [benign ? 'Recognised as a legitimate transactional or OTP message' : 'No strong known scam pattern found'], remediationSteps: details.steps,
    subScores: { urgency: subScore('urgency'), impersonation: subScore('impersonation'), coercion: subScore('coercion'), financialAsk: subScore('financial') }, signals,
    entities: entitiesFor(displayText), detectedLanguage: languageFor(displayText), scores: { rules: riskScore / 100, semantic: null, fused: riskScore / 100 }, engine: { mode: 'offline-rules', rulesVersion: rules.version, latencyMs },
    trace: [{ stage: 'normalize', ms: 0, detail: `${displayText.length} chars, lang=${languageFor(displayText)}` }, { stage: 'rules', ms: latencyMs, detail: `${signals.length} signals; rules score ${riskScore}` }],
  };
};
