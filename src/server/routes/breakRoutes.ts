import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../firebase.ts';

const router = Router();

const DateRegex = /^\d{4}-\d{2}-\d{2}$/;

const BreakSessionSchema = z.object({
  date: z.string().regex(DateRegex, 'Date must be YYYY-MM-DD'),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().int().nonnegative().max(86400),
  notes: z.string().max(1000).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = BreakSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  try {
    const ref = await db.collection('breakSessions').add({
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ id: ref.id });
  } catch {
    res.status(500).json({ error: 'Failed to save break session' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const { date } = req.query;
  try {
    let query = db.collection('breakSessions').orderBy('createdAt', 'desc');
    if (typeof date === 'string' && DateRegex.test(date)) {
      query = query.where('date', '==', date) as typeof query;
    }
    const snapshot = await query.limit(50).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch break sessions' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json({ error: 'Invalid session ID' });
    return;
  }

  const UpdateSchema = BreakSessionSchema.partial().pick({ endTime: true, duration: true, notes: true });
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  try {
    await db.collection('breakSessions').doc(id).update({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update break session' });
  }
});

export default router;
