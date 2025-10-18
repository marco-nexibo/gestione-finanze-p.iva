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
    tenant_id INTEGER NOT NULL,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
  )`);

  // Tabella per le spese mensili
  db.run(`CREATE TABLE IF NOT EXISTS spese (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    categoria TEXT,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
  )`);

  // Tabella per i prelievi/stipendi
  db.run(`CREATE TABLE IF NOT EXISTS prelievi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    importo REAL NOT NULL,
    descrizione TEXT,
    data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
  )`);

  // Tabella per il profilo fiscale semplificato
  db.run(`CREATE TABLE IF NOT EXISTS profilo_fiscale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    aliquota_irpef INTEGER,
    coefficiente_redditivita INTEGER,
    gestione_inps TEXT,
    data_aggiornamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
  )`);

  // Tabella per i tenant (clienti)
  db.run(`CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    subscription_status TEXT DEFAULT 'trial',
    subscription_end_date DATETIME,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabella per gli utenti (ora collegata ai tenant)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
  )`);

  // Collegamento utenti ai dati finanziari (per futura espansione multi-utente)
  db.run(`CREATE TABLE IF NOT EXISTS user_data_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_type TEXT NOT NULL,
    data_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Migrazione: aggiungi tenant_id alle tabelle esistenti
  db.all("PRAGMA table_info(entrate)", (err, columns) => {
    if (err) {
      console.error('Errore nel controllo struttura tabella entrate:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);

    // Se la tabella non ha tenant_id, aggiungilo
    if (!columnNames.includes('tenant_id')) {
      console.log('Migrazione: aggiunta tenant_id alle tabelle esistenti...');

      // Crea un tenant di default per i dati esistenti
      db.run(`INSERT INTO tenants (name, email, subscription_status) VALUES ('Default Tenant', 'default@forfettapp.com', 'active')`, function (err) {
        if (err) {
          console.error('Errore nella creazione tenant di default:', err);
          return;
        }

        const defaultTenantId = this.lastID;
        console.log('Creato tenant di default con ID:', defaultTenantId);

        // Aggiungi tenant_id alle tabelle esistenti
        const tables = ['entrate', 'spese', 'prelievi', 'profilo_fiscale'];
        let completed = 0;

        tables.forEach(table => {
          db.run(`ALTER TABLE ${table} ADD COLUMN tenant_id INTEGER DEFAULT ${defaultTenantId}`, (err) => {
            if (err) {
              console.error(`Errore nell'aggiunta tenant_id a ${table}:`, err);
            } else {
              console.log(`Aggiunto tenant_id a ${table}`);
            }
            completed++;
            if (completed === tables.length) {
              console.log('Migrazione completata: tutte le tabelle aggiornate con tenant_id');
            }
          });
        });
      });
    }
  });

  console.log('Database inizializzato correttamente');
});

module.exports = db;
