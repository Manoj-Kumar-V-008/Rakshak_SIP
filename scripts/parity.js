// Parity: JS (app offline engine) vs expected golden levels/types.
// Mirrors src/services/engine/localEngine.ts matching: RegExp(pattern, 'gi'), benign cap, noisy-OR, cut-offs 20/60.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'rules.json'), 'utf8'));
const cases = fs.readFileSync(path.join(root, 'shared', 'golden_cases.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);

const normalize = (t) => t.normalize('NFKC').replace(/[​‌‍﻿]/g, '').replace(/\s+/g, ' ').trim();
const scoreFor = (s) => s.length === 0 ? 0 : Math.round((1 - s.reduce((p, x) => p * (1 - x.weight), 1)) * 100);
const typeSignals = { digital_arrest: ['authority_impersonation', 'legal_threat', 'secrecy_isolation'], credential_phishing: ['credential_request'], utility_disconnection: ['utility_disconnect'], lottery_prize: ['prize_claim'], fake_job: ['task_job_offer'], investment_fraud: ['investment_guarantee'], loan_harassment: ['loan_harassment'], malicious_app_or_hijack: ['malicious_app'], suspicious_link: ['shortened_link'] };
const typeFor = (signals) => {
  const ids = new Set(signals.map((s) => s.id));
  if (ids.has('authority_impersonation') && ids.has('legal_threat')) return 'digital_arrest';
  let best = 'unverified', bestScore = 0;
  for (const [typeId, wanted] of Object.entries(typeSignals)) {
    const score = signals.filter((s) => wanted.includes(s.id)).reduce((t, s) => t + s.weight, 0);
    if (score > bestScore) { best = typeId; bestScore = score; }
  }
  return best;
};

let failures = 0;
for (const c of cases) {
  const text = normalize(c.text);
  let signals = [];
  for (const def of rules.signals) {
    let hits = 0;
    for (const p of def.patterns) {
      const re = new RegExp(p, 'gi');
      let m; while ((m = re.exec(text))) { hits++; if (m[0].length === 0) re.lastIndex++; }
    }
    if (hits) signals.push({ id: def.id, weight: def.weight });
  }
  const benign = rules.benignPatterns.some((p) => new RegExp(p, 'i').test(text));
  let score = scoreFor(signals);
  if (benign) { score = Math.min(score, 10); signals = []; }
  const level = score <= 20 ? 'safe' : score <= 60 ? 'suspicious' : 'danger';
  const typeId = typeFor(signals);
  if (level !== c.expectLevel || (c.expectType && typeId !== c.expectType)) {
    failures++;
    console.error(`MISMATCH: expected ${c.expectLevel}/${c.expectType || '-'} got ${level}/${typeId}: ${c.text.slice(0, 80)}`);
  }
}
console.log(`${cases.length - failures}/${cases.length} parity cases match (JS engine vs golden).`);
process.exit(failures ? 1 : 0);
