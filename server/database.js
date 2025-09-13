const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea il database SQLite
const dbPath = path.join(__dirname, 'finanze.db');
const db = new sqlite3.Database(dbPath);

// Inizializza le tabelle
db.serialize(() => {
  // Tabella per le entrate mensili
  db.run(`CREATE TABLE IF NOT EXISTS entrate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Tabella per le spese mensili
    db.run(`CREATE TABLE IF NOT EXISTS spese (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    categoria TEXT,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Tabella per i prelievi/stipendi
    db.run(`CREATE TABLE IF NOT EXISTS prelievi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    console.log('Database inizializzato correttamente');
});

module.exports = db;
