-- PWHL Data
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  city TEXT,
  code TEXT
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_id TEXT,
  position TEXT,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS team_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  gp INTEGER DEFAULT 0,
  w INTEGER DEFAULT 0,
  l INTEGER DEFAULT 0,
  otl INTEGER DEFAULT 0,
  pts INTEGER DEFAULT 0,
  gf INTEGER DEFAULT 0,
  ga INTEGER DEFAULT 0,
  synced_at TEXT NOT NULL,
  UNIQUE(season_id, team_id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  gp INTEGER DEFAULT 0,
  g INTEGER DEFAULT 0,
  a INTEGER DEFAULT 0,
  pts INTEGER DEFAULT 0,
  plus_minus INTEGER DEFAULT 0,
  pim INTEGER DEFAULT 0,
  synced_at TEXT NOT NULL,
  UNIQUE(season_id, player_id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Fantasy League
CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commissioner_id TEXT NOT NULL,
  season_id INTEGER NOT NULL,
  max_teams INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL,
  FOREIGN KEY (commissioner_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

CREATE TABLE IF NOT EXISTS league_members (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(league_id, user_id),
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fantasy_rosters (
  id TEXT PRIMARY KEY,
  league_member_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  dropped_at TEXT,
  FOREIGN KEY (league_member_id) REFERENCES league_members(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS matchups (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  home_member_id TEXT NOT NULL,
  away_member_id TEXT NOT NULL,
  home_score REAL,
  away_score REAL,
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (home_member_id) REFERENCES league_members(id),
  FOREIGN KEY (away_member_id) REFERENCES league_members(id)
);

-- Seed current season
INSERT OR IGNORE INTO seasons (id, name, start_date, end_date)
VALUES (5, '2024-25', '2024-10-01', '2025-05-31');
