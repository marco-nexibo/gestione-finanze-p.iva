const express = require('express');
const cors = require('cors');
const db = require('./database');
const { authenticateToken, optionalAuth } = require('./auth');
const authRoutes = require('./auth-routes');
const { requireAdmin, requireOwner, requireFinancialAccess } = require('./middleware/roles');
const {
    entrateQueries,
    speseQueries,
    prelieviQueries,
    profiloFiscaleQueries,
    riepilogoQueries,
    anniQueries
} = require('./tenant-queries');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes (non protette)
app.use('/api/auth', authRoutes);

// Costanti per calcoli (rimossa - ora usiamo calcoli dinamici)

// ROUTES (protette da autenticazione)

// GET - Ottieni dati di un mese specifico
app.get('/api/mese/:anno/:mese', authenticateToken, async (req, res) => {
    const { anno, mese } = req.params;

    try {
        // Prima ottieni il profilo fiscale
        const profiloFiscale = await profiloFiscaleQueries.get(req.tenantId);

        // Calcola le percentuali dinamiche
        const calcoliTasse = calcolaPercentualiTasse(profiloFiscale, parseInt(anno));

        // Query parallele per ottenere tutti i dati del mese
        const [entrate, spese, prelievi] = await Promise.all([
            entrateQueries.getByMonth(req.tenantId, anno, mese),
            speseQueries.getByMonth(req.tenantId, anno, mese),
            prelieviQueries.getByMonth(req.tenantId, anno, mese)
        ]);

        const totaleEntrate = entrate.reduce((sum, entrata) => sum + entrata.importo, 0);
        const totaleSpese = spese.reduce((sum, spesa) => sum + spesa.importo, 0);
        const totalePrelievi = prelievi.reduce((sum, prelievo) => sum + prelievo.importo, 0);

        // Calcoli finanziari con percentuale dinamica
        const entrateNette = totaleEntrate;
        const tasseDaPagare = (entrateNette * calcoliTasse.percentualeTasse) / 100;
        const disponibileDopoTasse = entrateNette - tasseDaPagare;
        const disponibileDopSpese = disponibileDopoTasse - totaleSpese;
        const stipendioDisponibile = disponibileDopSpese - totalePrelievi;

        res.json({
            mese: parseInt(mese),
            anno: parseInt(anno),
            entrate: {
                lista: entrate,
                totale: totaleEntrate
            },
            spese: {
                lista: spese,
                totale: totaleSpese
            },
            prelievi: {
                lista: prelievi,
                totale: totalePrelievi
            },
            calcoli: {
                entrateNette,
                percentualeTasse: calcoliTasse.percentualeTasse,
                tasseDaPagare,
                disponibileDopoTasse,
                disponibileDopSpese,
                stipendioDisponibile,
                dettaglioTasse: calcoliTasse.dettaglio
            }
        });
    } catch (err) {
        console.error('Errore nel recupero dati:', err);
        res.status(500).json({ error: 'Errore nel recupero dei dati' });
    }
});

// POST - Aggiungi/Aggiorna entrate mensili
app.post('/api/entrate', authenticateToken, async (req, res) => {
    const { mese, anno, importo, descrizione } = req.body;

    try {
        const result = await entrateQueries.insert(req.tenantId, mese, anno, importo, descrizione);
        res.json({
            id: result.id,
            message: 'Entrate salvate correttamente',
            mese,
            anno,
            importo
        });
    } catch (err) {
        console.error('Errore inserimento entrate:', err);
        res.status(500).json({ error: 'Errore nell\'inserimento delle entrate' });
    }
});

// PUT - Modifica entrata esistente
app.put('/api/entrate/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { importo, descrizione } = req.body;

    try {
        const result = await entrateQueries.update(req.tenantId, id, importo, descrizione);
        res.json({
            message: 'Entrata modificata correttamente',
            id: parseInt(id),
            importo,
            descrizione
        });
    } catch (err) {
        console.error('Errore modifica entrata:', err);
        res.status(500).json({ error: 'Errore nella modifica dell\'entrata' });
    }
});

// POST - Aggiungi spesa
app.post('/api/spese', authenticateToken, async (req, res) => {
    const { mese, anno, importo, categoria, descrizione } = req.body;

    try {
        const result = await speseQueries.insert(req.tenantId, mese, anno, importo, categoria, descrizione);
        res.json({
            id: result.id,
            message: 'Spesa salvata correttamente',
            mese,
            anno,
            importo,
            categoria,
            descrizione
        });
    } catch (err) {
        console.error('Errore inserimento spesa:', err);
        res.status(500).json({ error: 'Errore nell\'inserimento della spesa' });
    }
});

// POST - Aggiungi prelievo/stipendio
app.post('/api/prelievi', authenticateToken, async (req, res) => {
    const { mese, anno, importo, descrizione } = req.body;

    try {
        const result = await prelieviQueries.insert(req.tenantId, mese, anno, importo, descrizione);
        res.json({
            id: result.id,
            message: 'Prelievo salvato correttamente',
            mese,
            anno,
            importo,
            descrizione
        });
    } catch (err) {
        console.error('Errore inserimento prelievo:', err);
        res.status(500).json({ error: 'Errore nell\'inserimento del prelievo' });
    }
});

// DELETE - Elimina spesa
app.delete('/api/spese/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await speseQueries.delete(req.tenantId, id);
        res.json({ message: 'Spesa eliminata correttamente' });
    } catch (err) {
        console.error('Errore eliminazione spesa:', err);
        res.status(500).json({ error: 'Errore nell\'eliminazione della spesa' });
    }
});

// DELETE - Elimina prelievo
app.delete('/api/prelievi/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await prelieviQueries.delete(req.tenantId, id);
        res.json({ message: 'Prelievo eliminato correttamente' });
    } catch (err) {
        console.error('Errore eliminazione prelievo:', err);
        res.status(500).json({ error: 'Errore nell\'eliminazione del prelievo' });
    }
});

// DELETE - Elimina singola entrata
app.delete('/api/entrate/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await entrateQueries.delete(req.tenantId, id);
        res.json({ message: 'Entrata eliminata correttamente' });
    } catch (err) {
        console.error('Errore eliminazione entrata:', err);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'entrata' });
    }
});

// GET - Riepilogo annuale
app.get('/api/riepilogo/:anno', authenticateToken, async (req, res) => {
    const { anno } = req.params;

    try {
        // Prima ottieni il profilo fiscale
        const profiloFiscale = await profiloFiscaleQueries.get(req.tenantId);

        // Calcola le percentuali dinamiche
        const calcoliTasse = calcolaPercentualiTasse(profiloFiscale, parseInt(anno));

        // Query parallele usando le helper queries
        const [entrate, spese, prelievi] = await Promise.all([
            riepilogoQueries.getEntrateByYear(req.tenantId, anno),
            riepilogoQueries.getSpeseByYear(req.tenantId, anno),
            riepilogoQueries.getPrelieviByYear(req.tenantId, anno)
        ]);

        const riepilogo = [];

        for (let mese = 1; mese <= 12; mese++) {
            const entrataDelMese = entrate.find(e => e.mese === mese)?.totale || 0;
            const spesaDelMese = spese.find(s => s.mese === mese)?.totale || 0;
            const prelieviDelMese = prelievi.find(p => p.mese === mese)?.totale || 0;

            const tasseDaPagare = (entrataDelMese * calcoliTasse.percentualeTasse) / 100;
            const disponibileDopTasse = entrataDelMese - tasseDaPagare;
            const stipendioDisponibile = disponibileDopTasse - spesaDelMese - prelieviDelMese;

            riepilogo.push({
                mese,
                entrate: entrataDelMese,
                spese: spesaDelMese,
                prelievi: prelieviDelMese,
                tasse: tasseDaPagare,
                stipendioDisponibile
            });
        }

        res.json({
            anno: parseInt(anno),
            riepilogo,
            totali: {
                entrate: riepilogo.reduce((sum, m) => sum + m.entrate, 0),
                spese: riepilogo.reduce((sum, m) => sum + m.spese, 0),
                prelievi: riepilogo.reduce((sum, m) => sum + m.prelievi, 0),
                tasse: riepilogo.reduce((sum, m) => sum + m.tasse, 0),
                stipendioDisponibile: riepilogo.reduce((sum, m) => sum + m.stipendioDisponibile, 0)
            },
            dettaglioTasse: calcoliTasse.dettaglio
        });
    } catch (err) {
        console.error('Errore nel riepilogo annuale:', err);
        res.status(500).json({ error: 'Errore nel calcolo del riepilogo annuale' });
    }
});


// GET - Ottieni anni disponibili nel database
app.get('/api/anni-disponibili', authenticateToken, async (req, res) => {
    try {
        const anni = await anniQueries.getAvailableYears(req.tenantId);
        res.json({ anni });
    } catch (err) {
        console.error('Errore nel recupero anni disponibili:', err);
        res.status(500).json({ error: 'Errore nel recupero degli anni disponibili' });
    }
});

// Funzione per caricare i dati normativi annuali
function caricaDatiNormativi(anno) {
    try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, `dati_${anno}.json`);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Errore nel caricamento dati normativi per l'anno ${anno}:`, error);
        // Fallback ai dati 2025 se non trova il file
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'dati_2025.json');
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (fallbackError) {
            console.error('Errore nel caricamento dati normativi di fallback:', fallbackError);
            return null;
        }
    }
}

// Funzione per calcolare le percentuali delle tasse dinamicamente
function calcolaPercentualiTasse(profiloFiscale, anno) {
    if (!profiloFiscale || !profiloFiscale.coefficiente_redditivita) {
        // Fallback alla percentuale fissa se non c'è profilo
        return {
            percentualeTasse: 31.75,
            dettaglio: {
                irpef: 15,
                inps: 24,
                aliquotaInps: 24,
                coefficiente: 100
            }
        };
    }

    // Carica i dati normativi per l'anno
    const datiNormativi = caricaDatiNormativi(anno);
    if (!datiNormativi) {
        // Fallback se non riesce a caricare i dati normativi
        return {
            percentualeTasse: 31.75,
            dettaglio: {
                irpef: 15,
                inps: 24,
                aliquotaInps: 24,
                coefficiente: 100
            }
        };
    }

    const coefficiente = profiloFiscale.coefficiente_redditivita;
    const irpef = profiloFiscale.aliquota_irpef; // 5 o 15
    // Mappa gestione_inps dal DB alle chiavi del JSON
    const gestioneInpsKey = profiloFiscale.gestione_inps === 'separata'
        ? 'gestione_separata'
        : 'artigiani_commercianti';
    const inps = datiNormativi[gestioneInpsKey]?.aliquota_inps || 24;

    // Calcolo percentuale effettiva CORRETTO
    // Nel regime forfettario:
    // 1. Si applica il coefficiente al reddito
    // 2. Si sottraggono i contributi INPS
    // 3. Si applica l'IRPEF sul reddito già ridotto
    // 
    // Formula: Coeff × [INPS + (1 - INPS) × IRPEF] / 100
    const inpsDec = inps / 100;
    const irpefDec = irpef / 100;
    const percentualeTasse = coefficiente * (inpsDec + (1 - inpsDec) * irpefDec);

    // Calcolo percentuali effettive per il display
    // INPS si calcola sul reddito imponibile totale
    const inpsEffettivo = coefficiente * inpsDec;
    // IRPEF si calcola sul reddito imponibile ridotto dell'INPS
    const irpefEffettivo = coefficiente * (1 - inpsDec) * irpefDec;

    return {
        percentualeTasse: Math.round(percentualeTasse * 100) / 100, // Arrotondato a 2 decimali
        dettaglio: {
            irpef: Math.round(irpefEffettivo * 100) / 100,      // Percentuale IRPEF effettiva sul fatturato
            inps: Math.round(inpsEffettivo * 100) / 100,        // Percentuale INPS effettiva sul fatturato
            aliquotaInps: inps,                                  // Aliquota INPS pura (es. 26.07% o 24%)
            coefficiente,
            redditoImponibile: coefficiente
        }
    };
}

// API per il profilo fiscale

// GET - Ottieni profilo fiscale
app.get('/api/profilo-fiscale', authenticateToken, async (req, res) => {
    try {
        const profilo = await profiloFiscaleQueries.get(req.tenantId);
        res.json(profilo || {
            aliquota_irpef: null,
            coefficiente_redditivita: null,
            gestione_inps: null
        });
    } catch (err) {
        console.error('Errore nel recupero profilo fiscale:', err);
        res.status(500).json({ error: 'Errore nel recupero del profilo fiscale' });
    }
});

// POST - Salva profilo fiscale
app.post('/api/profilo-fiscale', authenticateToken, async (req, res) => {
    const {
        aliquotaIrpef,
        coefficienteRedditivita,
        gestioneInps
    } = req.body;

    try {
        // Convert gestioneInps from frontend format to backend format
        const gestioneInpsDb = gestioneInps === 'artigiani_commercianti' ? 'ordinaria' : 'separata';

        // Use the helper query which handles tenant_id automatically
        const result = await profiloFiscaleQueries.insert(req.tenantId, aliquotaIrpef, coefficienteRedditivita, gestioneInpsDb);

        res.json({
            success: true,
            message: 'Profilo fiscale salvato correttamente',
            id: result.id
        });
    } catch (err) {
        console.error('Errore nel salvataggio profilo fiscale:', err);
        res.status(500).json({ error: 'Errore nel salvataggio del profilo fiscale' });
    }
});


// ===== ADMIN ROUTES =====

// GET - Lista tutti i tenant (solo admin)
app.get('/api/admin/tenants', requireAdmin, (req, res) => {
    db.all(`
        SELECT t.*, 
               COUNT(u.id) as user_count,
               MAX(u.created_at) as last_user_activity
        FROM tenants t 
        LEFT JOIN users u ON t.id = u.tenant_id 
        GROUP BY t.id 
        ORDER BY t.created_at DESC
    `, (err, tenants) => {
        if (err) {
            console.error('Errore nel recupero tenant:', err);
            return res.status(500).json({ error: 'Errore nel recupero dei tenant' });
        }
        res.json({ tenants });
    });
});

// GET - Dettagli di un tenant specifico (solo admin)
app.get('/api/admin/tenants/:tenantId', requireAdmin, (req, res) => {
    const { tenantId } = req.params;

    db.get(`
        SELECT t.*, 
               COUNT(u.id) as user_count
        FROM tenants t 
        LEFT JOIN users u ON t.id = u.tenant_id 
        WHERE t.id = ?
        GROUP BY t.id
    `, [tenantId], (err, tenant) => {
        if (err) {
            console.error('Errore nel recupero tenant:', err);
            return res.status(500).json({ error: 'Errore nel recupero del tenant' });
        }

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant non trovato' });
        }

        // Ottieni anche gli utenti del tenant
        db.all('SELECT id, email, nome, cognome, role, created_at FROM users WHERE tenant_id = ?', [tenantId], (err, users) => {
            if (err) {
                console.error('Errore nel recupero utenti:', err);
                return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
            }

            res.json({
                tenant: {
                    ...tenant,
                    users: users || []
                }
            });
        });
    });
});

// PUT - Aggiorna stato abbonamento tenant (solo admin)
app.put('/api/admin/tenants/:tenantId/subscription', requireAdmin, (req, res) => {
    const { tenantId } = req.params;
    const { subscription_status, subscription_end_date, stripe_customer_id, stripe_subscription_id } = req.body;

    db.run(`
        UPDATE tenants 
        SET subscription_status = ?, 
            subscription_end_date = ?, 
            stripe_customer_id = ?, 
            stripe_subscription_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [subscription_status, subscription_end_date, stripe_customer_id, stripe_subscription_id, tenantId], function (err) {
        if (err) {
            console.error('Errore nell\'aggiornamento tenant:', err);
            return res.status(500).json({ error: 'Errore nell\'aggiornamento del tenant' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tenant non trovato' });
        }

        res.json({
            message: 'Stato abbonamento aggiornato con successo',
            tenant_id: tenantId,
            subscription_status,
            subscription_end_date
        });
    });
});

// GET - Statistiche generali (solo admin)
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const queries = {
        totalTenants: new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM tenants', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        }),
        activeSubscriptions: new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM tenants WHERE subscription_status = "active"', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        }),
        trialSubscriptions: new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM tenants WHERE subscription_status = "trial"', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        }),
        totalUsers: new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        })
    };

    Promise.all([
        queries.totalTenants,
        queries.activeSubscriptions,
        queries.trialSubscriptions,
        queries.totalUsers
    ]).then(([totalTenants, activeSubscriptions, trialSubscriptions, totalUsers]) => {
        res.json({
            totalTenants,
            activeSubscriptions,
            trialSubscriptions,
            expiredSubscriptions: totalTenants - activeSubscriptions - trialSubscriptions,
            totalUsers
        });
    }).catch(err => {
        console.error('Errore nel recupero statistiche:', err);
        res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
    });
});

// Avvio server
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});

// Gestione chiusura database
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Errore nella chiusura del database:', err);
        } else {
            console.log('Database chiuso correttamente');
        }
        process.exit(0);
    });
});
