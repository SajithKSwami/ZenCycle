import { Mood } from '../types';

export interface JournalInputs {
  achievement: string;
  learnings: string[];
  goodMoments: string[];
  okMoments: string[];
  sadMoments: string[];
  dateTime: string;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error('Gemini API request failed');
  const data = await response.json() as { text: string };
  return data.text;
}

export async function generateAffirmation(mood: Mood, careerGoal: string): Promise<string> {
  const prompt = `You are a wellness coach. Generate a single powerful affirmation (max 20 words) for someone feeling ${mood}${careerGoal ? ` who wants to ${careerGoal}` : ''}. Return only the affirmation text, no quotes or extra text.`;
  try {
    return await callGemini(prompt);
  } catch {
    return `You are capable, focused, and making progress every single day.`;
  }
}

export async function generateJournalEntry(inputs: JournalInputs): Promise<string> {
  const prompt = `You are a mindful journal writer. Create a reflective, encouraging journal entry based on this person's day on ${inputs.dateTime}.

Achievement: ${inputs.achievement}
Learnings: ${inputs.learnings.join(', ')}
Good moments: ${inputs.goodMoments.join(', ')}
OK moments: ${inputs.okMoments.join(', ')}
Challenging moments: ${inputs.sadMoments.join(', ')}

Write a warm, personal 3-4 paragraph journal entry in first person. Use markdown for structure. End with a forward-looking sentence.`;
  try {
    return await callGemini(prompt);
  } catch {
    return `## Today's Reflection\n\n${inputs.achievement}\n\n**Learnings:** ${inputs.learnings.join(', ')}\n\n*Tomorrow is another opportunity to grow.*`;
  }
}
