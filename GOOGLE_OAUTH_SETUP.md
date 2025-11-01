# Configurazione Google OAuth

Questo documento descrive come configurare l'accesso con Google per l'applicazione.

## Prerequisiti

- Un account Google
- Accesso a [Google Cloud Console](https://console.cloud.google.com/)

## Passaggi di Configurazione

### 1. Crea un Progetto in Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Clicca su "Seleziona un progetto" > "Nuovo progetto"
3. Inserisci un nome per il progetto (es. "Gestione Finanze OAuth")
4. Clicca su "Crea"

### 2. Configura OAuth Consent Screen

1. Nel menu a sinistra, vai su **"APIs & Services"** > **"OAuth consent screen"**
2. Seleziona **"External"** (per uso locale/testing)
3. Compila i campi obbligatori:
   - App name: "Gestione Finanze"
   - User support email: la tua email
   - Developer contact information: la tua email
4. Aggiungi gli scope necessari:
   - `openid`
   - `email`
   - `profile`
5. Clicca su "Save and Continue"
6. Aggiungi eventuali test users (per testing in modalità unverified)
7. Clicca su "Save and Continue" fino alla fine

### 3. Crea OAuth 2.0 Client ID

1. Nel menu a sinistra, vai su **"APIs & Services"** > **"Credentials"**
2. Clicca su **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Seleziona **"Web application"** come Application type
4. Inserisci un nome (es. "Gestione Finanze Web Client")
5. In **"Authorized JavaScript origins"**, aggiungi:
   ```
   http://localhost:3000
   ```
6. In **"Authorized redirect URIs"**, aggiungi:
   ```
   http://localhost:3000
   ```
7. Clicca su "Create"
8. **COPIA IL CLIENT ID** che viene mostrato (ti servirà dopo!)

### 4. Configura le Variabili d'Ambiente

#### Server (.env)

Crea un file `.env` nella cartella `server/` basandoti su `env.example`:

```bash
# Copia il template
cp server/env.example server/.env
```

Aggiungi il tuo Google Client ID:

```env
# Google OAuth
GOOGLE_CLIENT_ID=il-tuo-client-id-google.apps.googleusercontent.com
```

#### Client

Crea un file `.env` nella cartella `client/`:

```bash
# Crea il file .env
touch client/.env
```

Aggiungi:

```env
REACT_APP_GOOGLE_CLIENT_ID=il-tuo-client-id-google.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:3001
```

⚠️ **IMPORTANTE**: I file `.env` non devono essere committati nel repository! Sono già inclusi nel `.gitignore`.

### 5. Riavvia l'Applicazione

Dopo aver configurato le variabili d'ambiente, riavvia sia il backend che il frontend:

```bash
# Nel terminal del server
cd server
npm start

# Nel terminal del client
cd client
npm start
```

### 6. Test del Login con Google

1. Vai su http://localhost:3000
2. Dovresti vedere il pulsante "Accedi con Google" nella pagina di login
3. Clicca sul pulsante
4. Verrà aperto il popup di Google per l'autenticazione
5. Scegli un account Google (usa uno degli account test se hai creato test users)
6. Autorizza l'applicazione
7. Se tutto funziona, verrai reindirizzato automaticamente nella dashboard!

## Troubleshooting

### Errore: "OAuth client not authorized"

- Verifica di aver aggiunto `http://localhost:3000` agli **Authorized JavaScript origins**
- Verifica di aver aggiunto `http://localhost:3000` agli **Authorized redirect URIs**
- Riavvia sia il server che il client

### Errore: "redirect_uri_mismatch"

- Verifica che l'URI di redirect nel client corrisponda esattamente a quello configurato in Google Console
- Assicurati di non avere `http://localhost:3000/` con lo slash finale (o assicurati che corrisponda esattamente)

### Il pulsante Google non appare

- Verifica che `REACT_APP_GOOGLE_CLIENT_ID` sia configurato correttamente nel `.env` del client
- Verifica che il GoogleOAuthProvider in `client/src/index.tsx` riceva il client ID
- Controlla la console del browser per eventuali errori

### Errore durante il login

- Verifica che `GOOGLE_CLIENT_ID` sia configurato correttamente nel `.env` del server
- Controlla i log del server per dettagli sull'errore
- Assicurati che il server sia in ascolto sulla porta 3001

## Produzione

Per l'ambiente di produzione, ricorda di:

1. Cambiare l'OAuth consent screen da "External" a "Production" (richiede verifica Google)
2. Aggiungere il tuo dominio reale agli **Authorized JavaScript origins** e **Authorized redirect URIs**
3. Aggiornare le variabili d'ambiente con le credenziali di produzione
4. Cambiare `JWT_SECRET` con un valore sicuro e casuale

## Sicurezza

- ⚠️ **NON committare mai** i file `.env` nel repository
- 🔐 Usa un `JWT_SECRET` forte e casuale in produzione
- 🛡️ Configura rate limiting per le route di autenticazione
- ✅ Verifica sempre i token Google lato server prima di creare/autenticare utenti

## Risorse Utili

- [Google Identity Platform Documentation](https://developers.google.com/identity)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

