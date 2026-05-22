const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'airsecure.db');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function openDatabase() {
  ensureDataDir();
  return new sqlite3.Database(DB_PATH);
}

module.exports = { openDatabase };
