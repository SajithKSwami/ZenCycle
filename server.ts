import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import journalRoutes from './src/server/routes/journalRoutes.ts';
import breakRoutes from './src/server/routes/breakRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT ?? '3000', 10);

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  }));

  app.use(cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '50kb' }));

  // Rate limit all API routes
  app.use('/api', apiLimiter);

  // Gemini proxy — keeps API key server-side only
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });
  app.post('/api/gemini', async (req, res) => {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
      res.status(400).json({ error: 'Invalid prompt' });
      return;
    }
    try {
      const result = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      res.json({ text: result.text });
    } catch {
      res.status(502).json({ error: 'Gemini request failed' });
    }
  });

  // API Routes
  app.use('/api/journal', journalRoutes);
  app.use('/api/breaks', breakRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
