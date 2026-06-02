import { GoogleGenAI } from '@google/genai';
import { Mood } from '../types';

export interface JournalInputs {
  achievement: string;
  learnings: string[];
  goodMoments: string[];
  okMoments: string[];
  sadMoments: string[];
  dateTime: string;
}

// Gemini runs client-side on Firebase Hosting (no backend server available).
// The API key is restricted to this domain in the Google Cloud Console.
const GEMINI_API_KEY = 'AIzaSyBSDUpRrKn4OSm1D9fMBbkTwhyTZnLRGHQ';

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return _ai;
}

async function callGemini(prompt: string): Promise<string> {
  const result = await getAI().models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return result.text ?? '';
}

export async function generateAffirmation(mood: Mood, careerGoal: string): Promise<string> {
  const prompt = `You are a wellness coach. Generate a single powerful affirmation (max 20 words) for someone feeling ${mood}${careerGoal ? ` who wants to ${careerGoal}` : ''}. Return only the affirmation text, no quotes or extra text.`;
  try {
    return await callGemini(prompt);
  } catch {
    return 'You are capable, focused, and making progress every single day.';
  }
}

export async function generateJournalEntry(inputs: JournalInputs): Promise<string> {
  const prompt = `You are a mindful journal writer. Create a reflective, encouraging journal entry based on this person's day on ${inputs.dateTime}.

Achievement: ${inputs.achievement}
Learnings: ${inputs.learnings.join(', ') || 'not specified'}
Good moments: ${inputs.goodMoments.join(', ') || 'not specified'}
OK moments: ${inputs.okMoments.join(', ') || 'not specified'}
Challenging moments: ${inputs.sadMoments.join(', ') || 'not specified'}

Write a warm, personal 3-4 paragraph journal entry in first person. Use markdown for structure. End with a forward-looking sentence.`;
  try {
    return await callGemini(prompt);
  } catch {
    return `## Today's Reflection — ${inputs.dateTime}\n\n${inputs.achievement}\n\n**What I learned:** ${inputs.learnings.join(', ') || '—'}\n\n*Tomorrow is another opportunity to grow.*`;
  }
}
