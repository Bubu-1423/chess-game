-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT 'A',
  elo_rating INTEGER DEFAULT 1200,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  games_played INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  avg_accuracy REAL DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Games Table
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  opponent TEXT DEFAULT 'Stockfish AI',
  difficulty TEXT DEFAULT 'Medium',
  time_control TEXT DEFAULT 'Blitz 5+0',
  moves TEXT NOT NULL, -- JSON array of moves
  result TEXT CHECK(result IN ('win', 'loss', 'draw')),
  accuracy REAL,
  blunders INTEGER DEFAULT 0,
  total_moves INTEGER,
  opening TEXT,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Challenges Table
CREATE TABLE challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Leaderboard Cache (updated daily)
CREATE TABLE leaderboard (
  user_id INTEGER PRIMARY KEY,
  elo_rating INTEGER,
  rank INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Indexes for performance
CREATE INDEX idx_games_user ON games(user_id);
CREATE INDEX idx_games_date ON games(played_at);
CREATE INDEX idx_users_elo ON users(elo_rating);