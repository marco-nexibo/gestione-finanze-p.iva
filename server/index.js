const express = require('express');
const cors = require('cors');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Costanti per calcoli
const PERCENTUALE_TASSE_INPS = 31.75; // 31.75%

// ROUTES

// GET - Ottieni dati di un mese specifico
app.get('/api/mese/:anno/:mese', (req, res) => {
    const { anno, mese } = req.params;

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

            // Calcoli finanziari
            const entrateNette = totaleEntrate;
            const tasseDaPagare = (entrateNette * PERCENTUALE_TASSE_INPS) / 100;
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
                    percentualeTasse: PERCENTUALE_TASSE_INPS,
                    tasseDaPagare,
                    disponibileDopoTasse,
                    disponibileDopSpese,
                    stipendioDisponibile
                }
            });
        })
        .catch(err => {
            console.error('Errore nel recupero dati:', err);
            res.status(500).json({ error: 'Errore nel recupero dei dati' });
        });
});

// POST - Aggiungi/Aggiorna entrate mensili
app.post('/api/entrate', (req, res) => {
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
app.put('/api/entrate/:id', (req, res) => {
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
app.post('/api/spese', (req, res) => {
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
app.post('/api/prelievi', (req, res) => {
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
app.delete('/api/spese/:id', (req, res) => {
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
app.delete('/api/prelievi/:id', (req, res) => {
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
app.delete('/api/entrate/:id', (req, res) => {
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
app.get('/api/riepilogo/:anno', (req, res) => {
    const { anno } = req.params;

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

                const tasseDaPagare = (entrataDelMese * PERCENTUALE_TASSE_INPS) / 100;
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
                }
            });
        })
        .catch(err => {
            console.error('Errore nel riepilogo annuale:', err);
            res.status(500).json({ error: 'Errore nel calcolo del riepilogo annuale' });
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
