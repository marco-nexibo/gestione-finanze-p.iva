const express = require('express');
const cors = require('cors');
const db = require('./database');
const { authenticateToken, optionalAuth } = require('./auth');
const authRoutes = require('./auth-routes');
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
app.get('/api/mese/:anno/:mese', authenticateToken, (req, res) => {
    const { anno, mese } = req.params;

    // Prima ottieni il profilo fiscale, poi i dati del mese
    db.get('SELECT * FROM profilo_fiscale ORDER BY data_aggiornamento DESC LIMIT 1', (err, profiloFiscale) => {
        if (err) {
            console.error('Errore nel recupero profilo fiscale:', err);
            // Continua con percentuale fissa se errore
            profiloFiscale = null;
        }

        // Calcola le percentuali dinamiche
        const calcoliTasse = calcolaPercentualiTasse(profiloFiscale, parseInt(anno));

        // Query parallele per ottenere tutti i dati del mese
        const queries = {
            entrate: new Promise((resolve, reject) => {
                db.all('SELECT * FROM entrate WHERE anno = ? AND mese = ?', [anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }),
            spese: new Promise((resolve, reject) => {
                db.all('SELECT * FROM spese WHERE anno = ? AND mese = ?', [anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }),
            prelievi: new Promise((resolve, reject) => {
                db.all('SELECT * FROM prelievi WHERE anno = ? AND mese = ?', [anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            })
        };

        Promise.all([queries.entrate, queries.spese, queries.prelievi])
            .then(([entrate, spese, prelievi]) => {
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
            })
            .catch(err => {
                console.error('Errore nel recupero dati:', err);
                res.status(500).json({ error: 'Errore nel recupero dei dati' });
            });
    });
});

// POST - Aggiungi/Aggiorna entrate mensili
app.post('/api/entrate', authenticateToken, (req, res) => {
    const { mese, anno, importo, descrizione } = req.body;

    db.run(
        `INSERT INTO entrate (mese, anno, importo, descrizione) 
     VALUES (?, ?, ?, ?)`,
        [mese, anno, importo, descrizione || ''],
        function (err) {
            if (err) {
                console.error('Errore inserimento entrate:', err);
                res.status(500).json({ error: 'Errore nell\'inserimento delle entrate' });
            } else {
                res.json({
                    id: this.lastID,
                    message: 'Entrate salvate correttamente',
                    mese,
                    anno,
                    importo
                });
            }
        }
    );
});

// PUT - Modifica entrata esistente
app.put('/api/entrate/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { importo, descrizione } = req.body;

    db.run(
        `UPDATE entrate SET importo = ?, descrizione = ? WHERE id = ?`,
        [importo, descrizione || '', id],
        function (err) {
            if (err) {
                console.error('Errore modifica entrata:', err);
                res.status(500).json({ error: 'Errore nella modifica dell\'entrata' });
            } else {
                res.json({
                    message: 'Entrata modificata correttamente',
                    id: parseInt(id),
                    importo,
                    descrizione
                });
            }
        }
    );
});

// POST - Aggiungi spesa
app.post('/api/spese', authenticateToken, (req, res) => {
    const { mese, anno, importo, categoria, descrizione } = req.body;

    db.run(
        `INSERT INTO spese (mese, anno, importo, categoria, descrizione) 
     VALUES (?, ?, ?, ?, ?)`,
        [mese, anno, importo, categoria || '', descrizione || ''],
        function (err) {
            if (err) {
                console.error('Errore inserimento spesa:', err);
                res.status(500).json({ error: 'Errore nell\'inserimento della spesa' });
            } else {
                res.json({
                    id: this.lastID,
                    message: 'Spesa salvata correttamente',
                    mese,
                    anno,
                    importo,
                    categoria,
                    descrizione
                });
            }
        }
    );
});

// POST - Aggiungi prelievo/stipendio
app.post('/api/prelievi', authenticateToken, (req, res) => {
    const { mese, anno, importo, descrizione } = req.body;

    db.run(
        `INSERT INTO prelievi (mese, anno, importo, descrizione) 
     VALUES (?, ?, ?, ?)`,
        [mese, anno, importo, descrizione || ''],
        function (err) {
            if (err) {
                console.error('Errore inserimento prelievo:', err);
                res.status(500).json({ error: 'Errore nell\'inserimento del prelievo' });
            } else {
                res.json({
                    id: this.lastID,
                    message: 'Prelievo salvato correttamente',
                    mese,
                    anno,
                    importo,
                    descrizione
                });
            }
        }
    );
});

// DELETE - Elimina spesa
app.delete('/api/spese/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM spese WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Errore eliminazione spesa:', err);
            res.status(500).json({ error: 'Errore nell\'eliminazione della spesa' });
        } else {
            res.json({ message: 'Spesa eliminata correttamente' });
        }
    });
});

// DELETE - Elimina prelievo
app.delete('/api/prelievi/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM prelievi WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Errore eliminazione prelievo:', err);
            res.status(500).json({ error: 'Errore nell\'eliminazione del prelievo' });
        } else {
            res.json({ message: 'Prelievo eliminato correttamente' });
        }
    });
});

// DELETE - Elimina singola entrata
app.delete('/api/entrate/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM entrate WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Errore eliminazione entrata:', err);
            res.status(500).json({ error: 'Errore nell\'eliminazione dell\'entrata' });
        } else {
            res.json({ message: 'Entrata eliminata correttamente' });
        }
    });
});

// GET - Riepilogo annuale
app.get('/api/riepilogo/:anno', authenticateToken, (req, res) => {
    const { anno } = req.params;

    // Prima ottieni il profilo fiscale
    db.get('SELECT * FROM profilo_fiscale ORDER BY data_aggiornamento DESC LIMIT 1', (err, profiloFiscale) => {
        if (err) {
            console.error('Errore nel recupero profilo fiscale:', err);
            profiloFiscale = null;
        }

        // Calcola le percentuali dinamiche
        const calcoliTasse = calcolaPercentualiTasse(profiloFiscale, parseInt(anno));

        const queries = {
            entrate: new Promise((resolve, reject) => {
                db.all('SELECT mese, SUM(importo) as totale FROM entrate WHERE anno = ? GROUP BY mese ORDER BY mese', [anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }),
            spese: new Promise((resolve, reject) => {
                db.all('SELECT mese, SUM(importo) as totale FROM spese WHERE anno = ? GROUP BY mese ORDER BY mese', [anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }),
            prelievi: new Promise((resolve, reject) => {
                db.all('SELECT mese, SUM(importo) as totale FROM prelievi WHERE anno = ? GROUP BY mese ORDER BY mese', [anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            })
        };

        Promise.all([queries.entrate, queries.spese, queries.prelievi])
            .then(([entrate, spese, prelievi]) => {
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
            })
            .catch(err => {
                console.error('Errore nel riepilogo annuale:', err);
                res.status(500).json({ error: 'Errore nel calcolo del riepilogo annuale' });
            });
    });
});


// GET - Ottieni anni disponibili nel database
app.get('/api/anni-disponibili', authenticateToken, (req, res) => {
    const anni = new Set();

    // Query parallele per ottenere anni da tutte le tabelle
    const queries = [
        new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT anno FROM entrate ORDER BY anno', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        }),
        new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT anno FROM spese ORDER BY anno', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        }),
        new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT anno FROM prelievi ORDER BY anno', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        })
    ];

    Promise.all(queries)
        .then(([entrate, spese, prelievi]) => {
            // Raccoglie tutti gli anni da tutte le tabelle
            [...entrate, ...spese, ...prelievi].forEach(row => {
                anni.add(row.anno);
            });

            // Converte Set in array e ordina
            const anniArray = Array.from(anni).sort((a, b) => a - b);

            res.json({ anni: anniArray });
        })
        .catch(err => {
            console.error('Errore nel recupero anni disponibili:', err);
            res.status(500).json({ error: 'Errore nel recupero degli anni disponibili' });
        });
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
                coefficiente: 100
            }
        };
    }

    const coefficiente = profiloFiscale.coefficiente_redditivita;
    const irpef = profiloFiscale.aliquota_irpef; // 5 o 15
    const inps = datiNormativi[profiloFiscale.gestione_inps]?.aliquota_inps || 24;

    // Calcolo percentuale effettiva
    // La percentuale si applica al reddito imponibile (fatturato * coefficiente)
    // Quindi: (irpef + inps) * coefficiente / 100
    const percentualeTasse = ((irpef + inps) * coefficiente) / 100;

    return {
        percentualeTasse: Math.round(percentualeTasse * 100) / 100, // Arrotondato a 2 decimali
        dettaglio: {
            irpef,
            inps,
            coefficiente,
            redditoImponibile: coefficiente
        }
    };
}

// API per il profilo fiscale

// GET - Ottieni profilo fiscale
app.get('/api/profilo-fiscale', authenticateToken, (req, res) => {
    db.get('SELECT * FROM profilo_fiscale ORDER BY data_aggiornamento DESC LIMIT 1', (err, row) => {
        if (err) {
            console.error('Errore nel recupero profilo fiscale:', err);
            res.status(500).json({ error: 'Errore nel recupero del profilo fiscale' });
        } else {
            res.json(row || {
                aliquota_irpef: null,
                coefficiente_redditivita: null,
                gestione_inps: null
            });
        }
    });
});

// POST - Salva profilo fiscale
app.post('/api/profilo-fiscale', authenticateToken, (req, res) => {
    const {
        aliquotaIrpef,
        coefficienteRedditivita,
        gestioneInps
    } = req.body;

    // Prima elimina il profilo esistente (ne teniamo solo uno)
    db.run('DELETE FROM profilo_fiscale', (err) => {
        if (err) {
            console.error('Errore nell\'eliminazione profilo esistente:', err);
            res.status(500).json({ error: 'Errore nel salvataggio del profilo fiscale' });
            return;
        }

        // Inserisci il nuovo profilo
        db.run(
            `INSERT INTO profilo_fiscale 
             (aliquota_irpef, coefficiente_redditivita, gestione_inps) 
             VALUES (?, ?, ?)`,
            [aliquotaIrpef, coefficienteRedditivita, gestioneInps],
            function (err) {
                if (err) {
                    console.error('Errore nel salvataggio profilo fiscale:', err);
                    res.status(500).json({ error: 'Errore nel salvataggio del profilo fiscale' });
                } else {
                    res.json({
                        success: true,
                        message: 'Profilo fiscale salvato correttamente',
                        id: this.lastID
                    });
                }
            }
        );
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
