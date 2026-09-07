-- Schema Database Cloudflare D1 untuk WACRM Pro

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  email TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  color TEXT DEFAULT '#10B981',
  role TEXT DEFAULT '',
  assigned_agent TEXT DEFAULT '',
  assigned_username TEXT DEFAULT '',
  status TEXT DEFAULT 'disconnected'
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  lid TEXT,
  company TEXT DEFAULT '-',
  email TEXT DEFAULT '',
  tags TEXT DEFAULT '["Lead Baru"]',
  assigned_agent TEXT DEFAULT 'Dewi CS',
  account_id TEXT DEFAULT 'account_1',
  stage TEXT DEFAULT 'lead',
  deal_value REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  notes TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  from_me INTEGER NOT NULL DEFAULT 0,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT DEFAULT 'delivered',
  media_url TEXT,
  media_type TEXT
);

CREATE TABLE IF NOT EXISTS quick_replies (
  id TEXT PRIMARY KEY,
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

-- Indexing untuk kecepatan pencarian
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_lid ON contacts(lid);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_agent ON contacts(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_account ON messages(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
