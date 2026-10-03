import * as SecureStore from 'expo-secure-store';

const KEY = 'gemini_api_key';

export const getGeminiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
};

export const setGeminiKey = async (key: string): Promise<void> => {
  const trimmed = key.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(KEY);
    return;
  }
  await SecureStore.setItemAsync(KEY, trimmed);
};

export const hasGeminiKey = async (): Promise<boolean> => {
  const key = await getGeminiKey();
  return !!key;
};

// Opt-in only: sends the scanned text to Google Gemini. Never called without an explicit tap.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export const explainSimply = async (message: string, scamType: string, riskScore: number, indicators: string[]): Promise<string> => {
  const apiKey = await getGeminiKey();
  if (!apiKey) throw new Error('No Gemini key saved. Add one in Demo Connection to enable the explainer.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const prompt = `Explain in simple non-technical words (under 120 words, no jargon) why this message got risk score ${riskScore}/100 as ${scamType}. Indicators: ${indicators.join('; ')}. Message: ${message.slice(0, 800)}. End with one clear action, including Call 1930 if risky.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Gemini returned ${response.status}: ${detail.slice(0, 200) || 'no detail'}`);
    }
    const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini returned no explanation.');
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Gemini timed out after 15 seconds.');
    throw error instanceof Error ? error : new Error('Gemini request failed.');
  } finally {
    clearTimeout(timeout);
  }
};
