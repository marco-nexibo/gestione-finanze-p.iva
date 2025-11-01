const express = require('express');
const { hashPassword, comparePassword, generateToken, generateResetToken, authenticateToken } = require('./auth');
const db = require('./database');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

// Inizializza Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth Login/Register
router.post('/google', async (req, res) => {
    const { access_token } = req.body;

    if (!access_token) {
        return res.status(400).json({ error: 'Access token Google mancante' });
    }

    try {
        // Usa l'access token per ottenere le info utente
        const https = require('https');
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.googleapis.com',
                path: '/oauth2/v3/userinfo',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });

        const { email, given_name, family_name, picture } = response;

        if (!email) {
            return res.status(400).json({ error: 'Email non disponibile dal profilo Google' });
        }

        // Cerca se l'utente esiste già
        db.get(
            'SELECT u.*, t.subscription_status, t.subscription_end_date FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
            [email.toLowerCase()],
            async (err, user) => {
                if (err) {
                    console.error('Errore nel recupero utente Google:', err);
                    return res.status(500).json({ error: 'Errore del server' });
                }

                if (user) {
                    // Utente esistente - login
                    const token = generateToken(user);
                    res.json({
                        message: 'Login effettuato con Google',
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            nome: user.nome,
                            cognome: user.cognome,
                            tenant_id: user.tenant_id,
                            role: user.role,
                            onboarding_completed: user.onboarding_completed,
                            subscription_status: user.subscription_status,
                            subscription_end_date: user.subscription_end_date
                        }
                    });
                } else {
                    // Nuovo utente - registrazione
                    const nome = given_name || 'Utente';
                    const cognome = family_name || 'Google';

                    // Genera una password casuale (non verrà mai usata dato che fa login con Google)
                    const randomPassword = require('crypto').randomBytes(32).toString('hex');
                    const passwordHash = await hashPassword(randomPassword);

                    // Crea il tenant
                    db.run(
                        'INSERT INTO tenants (name, email, subscription_status, subscription_end_date) VALUES (?, ?, ?, ?)',
                        [nome.trim() + ' ' + cognome.trim(), email.toLowerCase(), 'trial', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)],
                        function (err) {
                            if (err) {
                                console.error('Errore nella creazione tenant Google:', err);
                                return res.status(500).json({ error: 'Errore nella registrazione' });
                            }

                            const tenantId = this.lastID;

                            // Crea l'utente
                            db.run(
                                'INSERT INTO users (tenant_id, email, password_hash, nome, cognome, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                [tenantId, email.toLowerCase(), passwordHash, nome.trim(), cognome.trim(), 'owner', true],
                                function (err) {
                                    if (err) {
                                        console.error('Errore nella registrazione utente Google:', err);
                                        return res.status(500).json({ error: 'Errore nella registrazione' });
                                    }

                                    const token = generateToken({
                                        id: this.lastID,
                                        email: email.toLowerCase(),
                                        tenant_id: tenantId
                                    });

                                    res.json({
                                        message: 'Registrazione completata con Google',
                                        token,
                                        user: {
                                            id: this.lastID,
                                            email: email.toLowerCase(),
                                            nome: nome.trim(),
                                            cognome: cognome.trim(),
                                            tenant_id: tenantId,
                                            role: 'owner',
                                            onboarding_completed: false,
                                            subscription_status: 'trial',
                                            subscription_end_date: null
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('Errore nella verifica token Google:', error);
        res.status(401).json({ error: 'Token Google non valido' });
    }
});

// Registrazione
router.post('/register', async (req, res) => {
    const { email, password, nome, cognome } = req.body;

    // Validazione
    if (!email || !password || !nome || !cognome) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
    }

    // Validazione email formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato email non valido' });
    }

    try {
        // Verifica se l'utente esiste già
        db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], async (err, existingUser) => {
            if (err) {
                console.error('Errore nel controllo utente esistente:', err);
                return res.status(500).json({ error: 'Errore del server' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Email già registrata' });
            }

            try {
                // Hash password
                const passwordHash = await hashPassword(password);

                // Prima crea il tenant
                db.run(
                    'INSERT INTO tenants (name, email, subscription_status, subscription_end_date) VALUES (?, ?, ?, ?)',
                    [nome.trim() + ' ' + cognome.trim(), email.toLowerCase(), 'trial', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)], // 14 giorni di trial
                    function (err) {
                        if (err) {
                            console.error('Errore nella creazione tenant:', err);
                            return res.status(500).json({ error: 'Errore nella registrazione' });
                        }

                        const tenantId = this.lastID;

                        // Poi crea l'utente collegato al tenant
                        db.run(
                            'INSERT INTO users (tenant_id, email, password_hash, nome, cognome, role) VALUES (?, ?, ?, ?, ?, ?)',
                            [tenantId, email.toLowerCase(), passwordHash, nome.trim(), cognome.trim(), 'owner'],
                            function (err) {
                                if (err) {
                                    console.error('Errore nella registrazione utente:', err);
                                    return res.status(500).json({ error: 'Errore nella registrazione' });
                                }

                                const token = generateToken({
                                    id: this.lastID,
                                    email: email.toLowerCase(),
                                    tenant_id: tenantId
                                });

                                res.json({
                                    message: 'Registrazione completata con successo',
                                    token,
                                    user: {
                                        id: this.lastID,
                                        email: email.toLowerCase(),
                                        nome: nome.trim(),
                                        cognome: cognome.trim(),
                                        tenant_id: tenantId,
                                        role: 'owner'
                                    }
                                });
                            }
                        );
                    }
                );
            } catch (hashError) {
                console.error('Errore nell\'hash della password:', hashError);
                res.status(500).json({ error: 'Errore del server' });
            }
        });
    } catch (error) {
        console.error('Errore generale nella registrazione:', error);
        res.status(500).json({ error: 'Errore del server' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e password sono obbligatorie' });
    }

    db.get('SELECT u.*, t.subscription_status, t.subscription_end_date FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) {
            console.error('Errore nel recupero utente:', err);
            return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        try {
            const isValidPassword = await comparePassword(password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            const token = generateToken(user);
            res.json({
                message: 'Login effettuato con successo',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    nome: user.nome,
                    cognome: user.cognome,
                    tenant_id: user.tenant_id,
                    role: user.role,
                    onboarding_completed: user.onboarding_completed,
                    subscription_status: user.subscription_status,
                    subscription_end_date: user.subscription_end_date
                }
            });
        } catch (error) {
            console.error('Errore nella verifica password:', error);
            res.status(500).json({ error: 'Errore del server' });
        }
    });
});

// Richiesta reset password
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email è obbligatoria' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], (err, user) => {
        if (err) {
            console.error('Errore nel recupero utente per reset:', err);
            return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
            // Per sicurezza, restituiamo sempre successo anche se l'email non esiste
            return res.json({
                message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password'
            });
        }

        const resetToken = generateResetToken();
        const expires = new Date(Date.now() + 3600000); // 1 ora

        db.run(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expires, user.id],
            (err) => {
                if (err) {
                    console.error('Errore nel salvataggio token reset:', err);
                    return res.status(500).json({ error: 'Errore del server' });
                }

                // TODO: Qui dovresti inviare l'email con il link di reset
                // Per ora restituiamo il token solo in modalità development
                const response = {
                    message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password'
                };

                // Solo in development, aggiungi il token per testing
                if (process.env.NODE_ENV !== 'production') {
                    response.resetToken = resetToken;
                }

                res.json(response);
            }
        );
    });
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nuova password sono obbligatori' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
    }

    db.get(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
        [token, new Date()],
        async (err, user) => {
            if (err) {
                console.error('Errore nel recupero token reset:', err);
                return res.status(500).json({ error: 'Errore del server' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Token non valido o scaduto' });
            }

            try {
                const passwordHash = await hashPassword(newPassword);

                db.run(
                    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                    [passwordHash, user.id],
                    (err) => {
                        if (err) {
                            console.error('Errore nell\'aggiornamento password:', err);
                            return res.status(500).json({ error: 'Errore del server' });
                        }

                        res.json({ message: 'Password aggiornata con successo' });
                    }
                );
            } catch (error) {
                console.error('Errore nell\'hash nuova password:', error);
                res.status(500).json({ error: 'Errore del server' });
            }
        }
    );
});

// Ottieni profilo utente corrente
router.get('/profile', authenticateToken, (req, res) => {
    db.get('SELECT u.id, u.email, u.nome, u.cognome, u.tenant_id, u.role, u.onboarding_completed, u.email_verified, t.subscription_status, t.subscription_end_date FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?', [req.user.id], (err, user) => {
        if (err) {
            console.error('Errore nel recupero profilo:', err);
            return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        res.json({ user });
    });
});

// Aggiorna profilo utente
router.put('/profile', authenticateToken, (req, res) => {
    const { nome, cognome } = req.body;

    if (!nome || !cognome) {
        return res.status(400).json({ error: 'Nome e cognome sono obbligatori' });
    }

    db.run(
        'UPDATE users SET nome = ?, cognome = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nome.trim(), cognome.trim(), req.user.id],
        function (err) {
            if (err) {
                console.error('Errore nell\'aggiornamento profilo:', err);
                return res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }

            res.json({
                message: 'Profilo aggiornato con successo',
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    nome: nome.trim(),
                    cognome: cognome.trim()
                }
            });
        }
    );
});

// Completa onboarding
router.post('/complete-onboarding', authenticateToken, async (req, res) => {
    const { aliquotaIrpef, coefficienteRedditivita, gestioneInps } = req.body;

    if (!aliquotaIrpef || !coefficienteRedditivita || !gestioneInps) {
        return res.status(400).json({ error: 'Tutti i campi del profilo fiscale sono obbligatori' });
    }

    try {
        // Converte i valori per il database
        const gestioneInpsDb = gestioneInps === 'artigiani_commercianti' ? 'ordinaria' : 'separata';

        // Prima salva il profilo fiscale
        const profiloFiscaleQueries = require('./tenant-queries').profiloFiscaleQueries;
        await profiloFiscaleQueries.insert(req.tenantId, aliquotaIrpef, coefficienteRedditivita, gestioneInpsDb);

        // Poi marca l'onboarding come completato
        db.run(
            'UPDATE users SET onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [req.user.id],
            function (err) {
                if (err) {
                    console.error('Errore nell\'aggiornamento onboarding:', err);
                    return res.status(500).json({ error: 'Errore nel completamento dell\'onboarding' });
                }

                res.json({
                    message: 'Onboarding completato con successo',
                    onboarding_completed: true
                });
            }
        );
    } catch (error) {
        console.error('Errore nel completamento onboarding:', error);
        res.status(500).json({ error: 'Errore nel completamento dell\'onboarding' });
    }
});

// Salta onboarding
router.post('/skip-onboarding', authenticateToken, (req, res) => {
    // Non aggiorniamo onboarding_completed - l'utente può accedere temporaneamente
    // ma l'onboarding rimane incompleto
    res.json({
        message: 'Accesso temporaneo consentito',
        onboarding_completed: false
    });
});

// Cambio password
router.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password corrente e nuova password sono obbligatorie' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'La nuova password deve essere di almeno 8 caratteri' });
    }

    // Verifica password corrente
    db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (err) {
            console.error('Errore nel recupero password utente:', err);
            return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        try {
            const isValidCurrentPassword = await comparePassword(currentPassword, user.password_hash);

            if (!isValidCurrentPassword) {
                return res.status(401).json({ error: 'Password corrente non corretta' });
            }

            // Hash nuova password e aggiorna
            const newPasswordHash = await hashPassword(newPassword);

            db.run(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newPasswordHash, req.user.id],
                (err) => {
                    if (err) {
                        console.error('Errore nell\'aggiornamento password:', err);
                        return res.status(500).json({ error: 'Errore nell\'aggiornamento della password' });
                    }

                    res.json({ message: 'Password cambiata con successo' });
                }
            );
        } catch (error) {
            console.error('Errore nella verifica/hash password:', error);
            res.status(500).json({ error: 'Errore del server' });
        }
    });
});

// Elimina account
router.delete('/delete-account', authenticateToken, async (req, res) => {
    const { password } = req.body;

    // Verifica password
    db.get('SELECT password_hash, email_verified FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (err) {
            console.error('Errore nel recupero password utente:', err);
            return res.status(500).json({ error: 'Errore del server' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Controlla se è un utente Google (email_verified = true)
        const isGoogleUser = user.email_verified === true || user.email_verified === 1;

        try {
            // Se non è un utente Google, richiedi la password
            if (!isGoogleUser) {
                if (!password) {
                    return res.status(400).json({ error: 'Password obbligatoria per eliminare l\'account' });
                }

                const isValidPassword = await comparePassword(password, user.password_hash);

                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Password non corretta' });
                }
            }

            // Ottieni tenant_id prima di eliminare
            db.get('SELECT tenant_id FROM users WHERE id = ?', [req.user.id], (err, userData) => {
                if (err) {
                    console.error('Errore nel recupero tenant_id:', err);
                    return res.status(500).json({ error: 'Errore del server' });
                }

                const tenantId = userData.tenant_id;

                // Elimina tutti i dati del tenant in ordine (per gestire foreign keys)
                // 1. Elimina profilo fiscale
                db.run('DELETE FROM profilo_fiscale WHERE tenant_id = ?', [tenantId], (err) => {
                    if (err) console.error('Errore eliminazione profilo fiscale:', err);

                    // 2. Elimina entrate
                    db.run('DELETE FROM entrate WHERE tenant_id = ?', [tenantId], (err) => {
                        if (err) console.error('Errore eliminazione entrate:', err);

                        // 3. Elimina spese
                        db.run('DELETE FROM spese WHERE tenant_id = ?', [tenantId], (err) => {
                            if (err) console.error('Errore eliminazione spese:', err);

                            // 4. Elimina prelievi
                            db.run('DELETE FROM prelievi WHERE tenant_id = ?', [tenantId], (err) => {
                                if (err) console.error('Errore eliminazione prelievi:', err);

                                // 5. Elimina user_data_access (se esistono)
                                db.run('DELETE FROM user_data_access WHERE user_id = ?', [req.user.id], (err) => {
                                    if (err) console.error('Errore eliminazione user_data_access:', err);

                                    // 6. Elimina tutti gli utenti del tenant
                                    db.run('DELETE FROM users WHERE tenant_id = ?', [tenantId], (err) => {
                                        if (err) {
                                            console.error('Errore eliminazione utenti:', err);
                                            return res.status(500).json({ error: 'Errore nell\'eliminazione degli utenti' });
                                        }

                                        // 7. Infine elimina il tenant
                                        db.run('DELETE FROM tenants WHERE id = ?', [tenantId], (err) => {
                                            if (err) {
                                                console.error('Errore eliminazione tenant:', err);
                                                return res.status(500).json({ error: 'Errore nell\'eliminazione del tenant' });
                                            }

                                            res.json({ message: 'Account eliminato con successo' });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Errore nella verifica password:', error);
            res.status(500).json({ error: 'Errore del server' });
        }
    });
});

module.exports = router;
