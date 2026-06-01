import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../firebase.ts';

const router = Router();

const JournalSchema = z.object({
  achievement: z.string().min(1).max(2000),
  learnings: z.array(z.string().max(500)).max(20),
  goodMoments: z.array(z.string().max(500)).max(20),
  okMoments: z.array(z.string().max(500)).max(20),
  sadMoments: z.array(z.string().max(500)).max(20),
  moodScore: z.number().int().min(1).max(11).optional(),
  reflectionSummary: z.string().max(5000).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = JournalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  try {
    const ref = await db.collection('journalEntries').add({
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ id: ref.id });
  } catch {
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('journalEntries')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(entries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json({ error: 'Invalid entry ID' });
    return;
  }
  try {
    await db.collection('journalEntries').doc(id).delete();
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

export default router;
