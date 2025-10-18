# ForfettApp - SaaS Multi-Tenant

## Modifiche Implementate

### 1. Database Multi-Tenant
- ✅ Aggiunta tabella `tenants` per gestire i clienti
- ✅ Aggiunto campo `tenant_id` a tutte le tabelle dei dati finanziari
- ✅ Migrazione automatica per i dati esistenti
- ✅ Trial di 14 giorni per nuovi utenti

### 2. Autenticazione Multi-Tenant
- ✅ Registrazione crea automaticamente un tenant
- ✅ Login include informazioni del tenant e abbonamento
- ✅ JWT token include `tenant_id`
- ✅ Middleware di autenticazione aggiornato

### 3. Isolamento Dati
- ✅ Tutte le query filtrano per `tenant_id`
- ✅ File `tenant-queries.js` con query helper
- ✅ Protezione contro accesso cross-tenant

### 4. Struttura Database

```sql
-- Tabella tenant (clienti)
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  subscription_status TEXT DEFAULT 'trial',
  subscription_end_date DATETIME,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella utenti (collegata ai tenant)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

-- Tutte le tabelle dei dati hanno tenant_id
-- entrate, spese, prelievi, profilo_fiscale
```

### 5. API Endpoints Aggiornati

Tutti gli endpoint ora includono il filtro per `tenant_id`:

- `GET /api/mese/:anno/:mese` - Dati mensili per tenant
- `POST /api/entrate` - Aggiungi entrata per tenant
- `POST /api/spese` - Aggiungi spesa per tenant
- `POST /api/prelievi` - Aggiungi prelievo per tenant
- `GET /api/riepilogo/:anno` - Riepilogo annuale per tenant
- `GET /api/profilo-fiscale` - Profilo fiscale per tenant

### 6. Autenticazione

- `POST /api/auth/register` - Crea tenant + utente
- `POST /api/auth/login` - Login con info tenant
- `GET /api/auth/profile` - Profilo con info abbonamento

## Prossimi Passi

### 1. Integrazione Stripe
- [ ] Configurare Stripe per pagamenti
- [ ] Webhook per gestire eventi pagamento
- [ ] Logica di sospensione account scaduti

### 2. Gestione Abbonamenti
- [ ] Middleware per verificare scadenza abbonamento
- [ ] Notifiche email per scadenze
- [ ] Dashboard per gestire abbonamenti

### 3. Deploy Produzione
- [ ] Configurare PostgreSQL invece di SQLite
- [ ] Deploy su Vercel + Railway
- [ ] Configurare SSL e domini

## Test

Per testare il sistema multi-tenant:

1. Registra un nuovo utente
2. Verifica che i dati siano isolati per tenant
3. Controlla che il trial sia attivo per 14 giorni

## Configurazione

Copia `env.example` come `.env` e configura:
- JWT_SECRET
- Stripe keys
- Email SMTP
- URL dell'app
