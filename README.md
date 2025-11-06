# Gestione Finanze P.IVA

Applicativo completo per la gestione delle finanze per partite IVA forfettarie al 15%.

## Caratteristiche

- 📊 **Dashboard completa** con calcolo automatico dello stipendio disponibile
- 💰 **Gestione entrate** mensili con calcolo tasse e contributi
- 🛒 **Tracciamento uscite** con categorizzazione
- 💳 **Gestione prelievi** con controllo disponibilità
- 📈 **Riepilogo annuale** con grafici e statistiche
- 📱 **Responsive design** per desktop e mobile

## Tecnologie

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (facilmente migrabile a PostgreSQL/MySQL)
- **Grafici**: Recharts
- **UI Icons**: Lucide React

## Installazione

### 1. Clona il repository
```bash
git clone <repository-url>
cd "Calcolo conti"
```

### 2. Installa le dipendenze
```bash
# Installa dipendenze per tutti i progetti
npm run install-all
```

### 3. Avvia l'applicazione
```bash
# Avvia sia backend che frontend in modalità sviluppo
npm run dev
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Struttura del Progetto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti React
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
├── server/                 # Backend Node.js
│   ├── index.js           # Server principale
│   ├── database.js        # Configurazione database
│   └── package.json
└── package.json           # Script principali
```

## Funzionalità Principali

### Dashboard
- Visualizzazione entrate, tasse e contributi, uscite e stipendio disponibile
- Calcolo automatico di tasse e contributi
- Navigazione tra i mesi
- Indicatori visivi per saldo positivo/negativo

### Gestione Entrate
- Inserimento entrate mensili
- Anteprima calcoli tasse e contributi
- Aggiornamento dati esistenti

### Gestione Uscite
- Aggiunta uscite con categoria e descrizione
- Eliminazione uscite
- Totale uscite mensili

### Gestione Prelievi
- Registrazione prelievi/stipendi
- Controllo disponibilità prima del prelievo
- Storico prelievi mensili

### Riepilogo Annuale
- Grafici mensili (barre e torta)
- Tabella dettagliata per ogni mese
- Totali annuali

## Calcoli Finanziari

L'applicazione calcola automaticamente:

1. **Entrate nette**: Importo fatturato
2. **Tasse e Contributi**: Calcolate dinamicamente in base al profilo fiscale (IRPEF + INPS)
3. **Disponibile dopo tasse**: Entrate - Tasse e Contributi
4. **Disponibile dopo uscite**: Disponibile dopo tasse - Uscite
5. **Stipendio disponibile**: Disponibile dopo uscite - Prelievi già effettuati

## Deploy

### Locale
```bash
# Build del frontend
npm run build

# Avvio in produzione
npm start
```

### Online
Il progetto è configurato per essere facilmente deployato su:
- **Vercel/Netlify** (Frontend)
- **Railway/Render** (Backend)
- **PlanetScale/Supabase** (Database)

## Configurazione Database

Il database SQLite viene creato automaticamente al primo avvio in `server/finanze.db`.

Per migrare a un database online, modifica le configurazioni in `server/database.js`.

## API Endpoints

- `GET /api/mese/:anno/:mese` - Dati mensili
- `POST /api/entrate` - Salva entrate
- `POST /api/spese` - Aggiungi uscita
- `POST /api/prelievi` - Aggiungi prelievo
- `DELETE /api/spese/:id` - Elimina spesa
- `DELETE /api/prelievi/:id` - Elimina prelievo
- `GET /api/riepilogo/:anno` - Riepilogo annuale

## Licenza

MIT License - Vedi LICENSE file per dettagli.

## Supporto

Per problemi o domande, apri una issue nel repository.
