const express = require('express');
const { hashPassword, comparePassword, generateToken, generateResetToken, authenticateToken } = require('./auth');
const db = require('./database');
const router = express.Router();

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
                // Hash password e crea utente
                const passwordHash = await hashPassword(password);

                db.run(
                    'INSERT INTO users (email, password_hash, nome, cognome) VALUES (?, ?, ?, ?)',
                    [email.toLowerCase(), passwordHash, nome.trim(), cognome.trim()],
                    function (err) {
                        if (err) {
                            console.error('Errore nella registrazione:', err);
                            return res.status(500).json({ error: 'Errore nella registrazione' });
                        }

                        const token = generateToken({ id: this.lastID, email: email.toLowerCase() });
                        res.json({
                            message: 'Registrazione completata con successo',
                            token,
                            user: {
                                id: this.lastID,
                                email: email.toLowerCase(),
                                nome: nome.trim(),
                                cognome: cognome.trim()
                            }
                        });
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

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
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
                    cognome: user.cognome
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
    db.get('SELECT id, email, nome, cognome FROM users WHERE id = ?', [req.user.id], (err, user) => {
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

module.exports = router;
