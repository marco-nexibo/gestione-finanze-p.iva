// Script per creare un utente admin
const db = require('./database');
const { hashPassword, generateToken } = require('./auth');

async function createAdmin() {
    try {
        console.log('Creazione utente admin...');

        // Hash della password
        const passwordHash = await hashPassword('admin123');

        // Crea tenant admin
        db.run(
            'INSERT INTO tenants (name, email, subscription_status) VALUES (?, ?, ?)',
            ['Admin ForfettApp', 'admin@forfettapp.com', 'active'],
            function (err) {
                if (err) {
                    console.error('Errore nella creazione tenant admin:', err);
                    return;
                }

                const tenantId = this.lastID;
                console.log('Tenant admin creato con ID:', tenantId);

                // Crea utente admin
                db.run(
                    'INSERT INTO users (tenant_id, email, password_hash, nome, cognome, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [tenantId, 'admin@forfettapp.com', passwordHash, 'Admin', 'ForfettApp', 'admin'],
                    function (err) {
                        if (err) {
                            console.error('Errore nella creazione utente admin:', err);
                            return;
                        }

                        const userId = this.lastID;
                        console.log('Utente admin creato con ID:', userId);

                        // Genera token
                        const token = generateToken({
                            id: userId,
                            email: 'admin@forfettapp.com',
                            tenant_id: tenantId,
                            role: 'admin',
                            subscription_status: 'active',
                            subscription_end_date: null
                        });

                        console.log('\\n=== CREDENZIALI ADMIN ===');
                        console.log('Email: admin@forfettapp.com');
                        console.log('Password: admin123');
                        console.log('Token:', token);
                        console.log('========================\\n');

                        process.exit(0);
                    }
                );
            }
        );
    } catch (error) {
        console.error('Errore generale:', error);
        process.exit(1);
    }
}

createAdmin();
