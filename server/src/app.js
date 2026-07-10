import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import foodRoutes from './routes/food.routes.js';
import plannerRoutes from './routes/planner.routes.js';
import coachRoutes from './routes/coach.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import weeklySummaryRoutes from './routes/weekly-summary.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting (basic) ──
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const entry = requestCounts.get(ip);
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
      }
    }
  }
  next();
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/weekly-summary', weeklySummaryRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🔥 Fit Flow server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
