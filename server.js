require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const challengeRoutes = require('./routes/challenges');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiter (only production)
if (process.env.NODE_ENV === 'production') {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use('/api/', limiter);
}

// ✅ FIXED DB PATH
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database', 'knightx.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ DB Error:', err);
  } else {
    console.log('✅ DB Connected');
  }
});

// Routes
app.use('/api/auth', authRoutes(db));
app.use('/api/users', userRoutes(db));
app.use('/api/games', gameRoutes(db));
app.use('/api/challenges', challengeRoutes(db));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});