# Sistema di Ruoli ForfettApp SaaS

## **Ruoli Implementati**

### **1. Admin (`admin`)**
- **Chi**: Tu (sviluppatore/proprietario)
- **Accesso**: Completo a tutto il sistema
- **Funzionalità**:
  - Gestione di tutti i tenant
  - Visualizzazione statistiche generali
  - Modifica stati abbonamento
  - Accesso a tutti i dati (cross-tenant)

### **2. Owner (`owner`)**
- **Chi**: Proprietario dell'account tenant (chi paga)
- **Accesso**: Solo ai propri dati finanziari
- **Funzionalità**:
  - Gestione entrate/spese/prelievi
  - Configurazione profilo fiscale
  - Visualizzazione riepilogo annuale
  - Gestione profilo personale

### **3. User (`user`)**
- **Chi**: Utenti aggiuntivi del tenant (futuro)
- **Accesso**: Limitato (da implementare)
- **Funzionalità**: Da definire

## **Stati Abbonamento**

### **1. Trial (`trial`)**
- **Durata**: 14 giorni
- **Accesso**: Completo alle funzionalità
- **Limitazioni**: Nessuna

### **2. Active (`active`)**
- **Durata**: Illimitata (fino a cancellazione)
- **Accesso**: Completo alle funzionalità
- **Limitazioni**: Nessuna

### **3. Expired (`expired`)**
- **Durata**: Scaduto
- **Accesso**: Bloccato
- **Limitazioni**: Tutte le operazioni bloccate

### **4. Cancelled (`cancelled`)**
- **Durata**: Cancellato
- **Accesso**: Bloccato
- **Limitazioni**: Tutte le operazioni bloccate

## **Middleware di Sicurezza**

### **1. `requireAdmin`**
- Solo admin può accedere
- Usato per: statistiche, gestione tenant

### **2. `requireOwner`**
- Admin + Owner possono accedere
- Usato per: operazioni sui dati finanziari

### **3. `requireActiveSubscription`**
- Verifica che l'abbonamento sia attivo
- Blocca accesso se scaduto

### **4. `requireFinancialAccess`**
- Combina `requireOwner` + `requireActiveSubscription`
- Usato per: tutte le operazioni sui dati

## **API Endpoints per Ruoli**

### **Admin Only**
- `GET /api/admin/stats` - Statistiche generali
- `GET /api/admin/tenants` - Lista tutti i tenant
- `GET /api/admin/tenants/:id` - Dettagli tenant
- `PUT /api/admin/tenants/:id/subscription` - Modifica abbonamento

### **Owner Only**
- `GET /api/mese/:anno/:mese` - Dati mensili
- `POST /api/entrate` - Aggiungi entrate
- `POST /api/spese` - Aggiungi spese
- `POST /api/prelievi` - Aggiungi prelievi
- `GET /api/riepilogo/:anno` - Riepilogo annuale
- `GET /api/profilo-fiscale` - Profilo fiscale

### **Pubblico**
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Reset password

## **Credenziali Admin**

```
Email: admin@forfettapp.com
Password: admin123
Role: admin
Subscription: active
```

## **Test di Sicurezza**

✅ **Admin può accedere a tutto**
✅ **Owner può accedere solo ai propri dati**
✅ **Owner non può accedere alle route admin**
✅ **Trial scaduto blocca l'accesso**
✅ **Isolamento dati per tenant**

## **Prossimi Passi**

1. **Integrazione Stripe** per pagamenti
2. **Dashboard admin** per gestione tenant
3. **Notifiche email** per scadenze
4. **Sistema di team sharing** (ruolo user)
5. **Audit log** per tracciare le operazioni
