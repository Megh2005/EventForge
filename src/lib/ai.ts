import type { EventItem } from './types';
import { vaultConfig } from './storage';
import { get } from 'svelte/store';

export interface AIResponse<T = any> {
  success: boolean;
  modelUsed?: string;
  data?: T;
  rawText?: string;
  mode?: string;
  warning?: string;
  notice?: string;
}

export async function callGeminiAI<T = any>(payload: {
  prompt?: string;
  task: 'blueprint' | 'optimize_budget' | 'vendor_rfp' | 'timeline_sync' | 'chat' | 'brainstorm';
  eventContext?: Partial<EventItem>;
  category?: string;
  systemInstruction?: string;
}): Promise<AIResponse<T>> {
  const config = get(vaultConfig);

  try {
    const keyToSend = (config.geminiApiKey && !config.geminiApiKey.includes('•')) ? config.geminiApiKey : undefined;

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(keyToSend ? { 'x-gemini-key': keyToSend } : {})
      },
      body: JSON.stringify({
        ...payload,
        apiKey: keyToSend,
        model: config.geminiModel || 'gemini-3.5-flash'
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gemini API call failed');
    }

    return await res.json();
  } catch (err: any) {
    console.error('[Gemini AI Client Error]:', err);
    throw err;
  }
}

// 1. Generate Complete Event Blueprint
export async function generateFullBlueprint(eventContext: Partial<EventItem>): Promise<any> {
  const res = await callGeminiAI({
    task: 'blueprint',
    eventContext
  });
  return res.data;
}

// 2. Budget Optimization & Overlooked Fee Analyzer
export async function optimizeBudgetWithAI(event: EventItem, notes?: string): Promise<string> {
  const res = await callGeminiAI({
    task: 'optimize_budget',
    eventContext: event,
    prompt: notes || 'Analyze this budget for cost savings, balance across categories, and overlooked hidden fees.'
  });
  return res.rawText || 'Budget analysis completed.';
}

// 3. Vendor RFP & Interview Guide Generator
export async function generateVendorGuideAI(event: EventItem, category: string): Promise<string> {
  const res = await callGeminiAI({
    task: 'vendor_rfp',
    eventContext: event,
    category,
    prompt: `Generate a tactful negotiation guide and key contract questions for vendor category: ${category}`
  });
  return res.rawText || 'Vendor guide generated.';
}

// 4. Minute-by-Minute Run of Show Timeline Generator
export async function generateTimelineRunOfShowAI(event: EventItem): Promise<string> {
  const res = await callGeminiAI({
    task: 'timeline_sync',
    eventContext: event,
    prompt: 'Generate an hourly and minute-by-minute Day-of schedule with crew cues and buffer times.'
  });
  return res.rawText || 'Timeline generated.';
}

// 5. Brainstorm Personalized Ideas
export async function brainstormIdeasWithAI(event: EventItem, category: string): Promise<string> {
  const res = await callGeminiAI({
    task: 'brainstorm',
    eventContext: event,
    category,
    prompt: `Brainstorm 5 extremely creative, viral, tactile, and unforgettable ideas for this ${event.type}. Category focus: ${category}. Keep it memorable, budget-friendly, and distinctive.`
  });
  return res.rawText || 'Ideas generated.';
}
