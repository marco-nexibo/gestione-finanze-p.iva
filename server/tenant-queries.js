// Helper per query multi-tenant
// Questo file contiene le query aggiornate per il multi-tenancy

const db = require('./database');

// Query per entrate
const entrateQueries = {
    // Ottieni entrate per tenant, anno e mese
    getByMonth: (tenantId, anno, mese) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM entrate WHERE tenant_id = ? AND anno = ? AND mese = ?',
                [tenantId, anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    },

    // Inserisci nuova entrata
    insert: (tenantId, mese, anno, importo, descrizione) => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO entrate (tenant_id, mese, anno, importo, descrizione) 
                 VALUES (?, ?, ?, ?, ?)`,
                [tenantId, mese, anno, importo, descrizione || ''],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    // Aggiorna entrata esistente
    update: (tenantId, id, importo, descrizione) => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE entrate SET importo = ?, descrizione = ? 
                 WHERE id = ? AND tenant_id = ?`,
                [importo, descrizione || '', id, tenantId],
                function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                }
            );
        });
    },

    // Elimina entrata
    delete: (tenantId, id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM entrate WHERE id = ? AND tenant_id = ?',
                [id, tenantId], function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
        });
    }
};

// Query per spese
const speseQueries = {
    getByMonth: (tenantId, anno, mese) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM spese WHERE tenant_id = ? AND anno = ? AND mese = ?',
                [tenantId, anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    },

    insert: (tenantId, mese, anno, importo, categoria, descrizione) => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO spese (tenant_id, mese, anno, importo, categoria, descrizione) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [tenantId, mese, anno, importo, categoria || '', descrizione || ''],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    delete: (tenantId, id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM spese WHERE id = ? AND tenant_id = ?',
                [id, tenantId], function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
        });
    }
};

// Query per prelievi
const prelieviQueries = {
    getByMonth: (tenantId, anno, mese) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM prelievi WHERE tenant_id = ? AND anno = ? AND mese = ?',
                [tenantId, anno, mese], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    },

    insert: (tenantId, mese, anno, importo, descrizione) => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO prelievi (tenant_id, mese, anno, importo, descrizione) 
                 VALUES (?, ?, ?, ?, ?)`,
                [tenantId, mese, anno, importo, descrizione || ''],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    },

    delete: (tenantId, id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM prelievi WHERE id = ? AND tenant_id = ?',
                [id, tenantId], function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
        });
    }
};

// Query per profilo fiscale
const profiloFiscaleQueries = {
    get: (tenantId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM profilo_fiscale WHERE tenant_id = ? ORDER BY data_aggiornamento DESC LIMIT 1',
                [tenantId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
    },

    insert: (tenantId, aliquotaIrpef, coefficienteRedditivita, gestioneInps) => {
        return new Promise((resolve, reject) => {
            // Prima elimina il profilo esistente
            db.run('DELETE FROM profilo_fiscale WHERE tenant_id = ?', [tenantId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Inserisci il nuovo profilo
                db.run(
                    `INSERT INTO profilo_fiscale 
                     (tenant_id, aliquota_irpef, coefficiente_redditivita, gestione_inps) 
                     VALUES (?, ?, ?, ?)`,
                    [tenantId, aliquotaIrpef, coefficienteRedditivita, gestioneInps],
                    function (err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID });
                    }
                );
            });
        });
    }
};

// Query per riepilogo annuale
const riepilogoQueries = {
    getEntrateByYear: (tenantId, anno) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT mese, SUM(importo) as totale FROM entrate WHERE tenant_id = ? AND anno = ? GROUP BY mese ORDER BY mese',
                [tenantId, anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    },

    getSpeseByYear: (tenantId, anno) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT mese, SUM(importo) as totale FROM spese WHERE tenant_id = ? AND anno = ? GROUP BY mese ORDER BY mese',
                [tenantId, anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    },

    getPrelieviByYear: (tenantId, anno) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT mese, SUM(importo) as totale FROM prelievi WHERE tenant_id = ? AND anno = ? GROUP BY mese ORDER BY mese',
                [tenantId, anno], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });
    }
};

// Query per anni disponibili
const anniQueries = {
    getAvailableYears: (tenantId) => {
        return new Promise((resolve, reject) => {
            const anni = new Set();

            const queries = [
                new Promise((resolve, reject) => {
                    db.all('SELECT DISTINCT anno FROM entrate WHERE tenant_id = ? ORDER BY anno',
                        [tenantId], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows || []);
                        });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT DISTINCT anno FROM spese WHERE tenant_id = ? ORDER BY anno',
                        [tenantId], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows || []);
                        });
                }),
                new Promise((resolve, reject) => {
                    db.all('SELECT DISTINCT anno FROM prelievi WHERE tenant_id = ? ORDER BY anno',
                        [tenantId], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows || []);
                        });
                })
            ];

            Promise.all(queries)
                .then(([entrate, spese, prelievi]) => {
                    [...entrate, ...spese, ...prelievi].forEach(row => {
                        anni.add(row.anno);
                    });
                    const anniArray = Array.from(anni).sort((a, b) => a - b);
                    resolve(anniArray);
                })
                .catch(reject);
        });
    }
};

module.exports = {
    entrateQueries,
    speseQueries,
    prelieviQueries,
    profiloFiscaleQueries,
    riepilogoQueries,
    anniQueries
};
