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

  // Tabella per il profilo fiscale semplificato
  db.run(`CREATE TABLE IF NOT EXISTS profilo_fiscale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aliquota_irpef INTEGER,
    coefficiente_redditivita INTEGER,
    gestione_inps TEXT,
    data_aggiornamento DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabella per gli utenti
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Collegamento utenti ai dati finanziari (per futura espansione multi-utente)
  db.run(`CREATE TABLE IF NOT EXISTS user_data_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_type TEXT NOT NULL,
    data_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Migrazione: aggiorna la tabella profilo_fiscale se ha la struttura vecchia
  db.all("PRAGMA table_info(profilo_fiscale)", (err, columns) => {
    if (err) {
      console.error('Errore nel controllo struttura tabella:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);

    // Se la tabella ha ancora i campi vecchi, la ricreiamo
    if (columnNames.includes('tipo_impresa')) {
      console.log('Migrazione: aggiornamento struttura tabella profilo_fiscale...');

      // Salva i dati esistenti se ci sono
      db.all("SELECT * FROM profilo_fiscale", (err, rows) => {
        if (err) {
          console.error('Errore nel salvataggio dati esistenti:', err);
          return;
        }

        // Elimina la tabella vecchia
        db.run("DROP TABLE profilo_fiscale", (err) => {
          if (err) {
            console.error('Errore nell\'eliminazione tabella vecchia:', err);
            return;
          }

          // Ricrea la tabella con la nuova struttura
          db.run(`CREATE TABLE profilo_fiscale (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aliquota_irpef INTEGER,
            coefficiente_redditivita INTEGER,
            gestione_inps TEXT,
            data_aggiornamento DATETIME DEFAULT CURRENT_TIMESTAMP
          )`, (err) => {
            if (err) {
              console.error('Errore nella creazione tabella nuova:', err);
              return;
            }

            console.log('Migrazione completata: tabella profilo_fiscale aggiornata');
          });
        });
      });
    }
  });

  console.log('Database inizializzato correttamente');
});

module.exports = db;
