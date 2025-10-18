// Esempio di come dovrebbero essere aggiornate le route principali
// Questo è solo un esempio - le route reali sono nel file index.js

// PUT - Modifica entrata esistente
app.put('/api/entrate/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { importo, descrizione } = req.body;

    try {
        const result = await entrateQueries.update(req.tenantId, id, importo, descrizione);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Entrata non trovata' });
        }
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
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Spesa non trovata' });
        }
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
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Prelievo non trovato' });
        }
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
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Entrata non trovata' });
        }
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

        // Query parallele per ottenere i dati annuali
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
        const result = await profiloFiscaleQueries.insert(
            req.tenantId,
            aliquotaIrpef,
            coefficienteRedditivita,
            gestioneInps
        );
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
