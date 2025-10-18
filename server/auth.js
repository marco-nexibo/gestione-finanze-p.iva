const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Middleware di autenticazione con controllo tenant
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido' });
        }

        // Aggiungi tenant_id al request
        req.user = user;
        req.tenantId = user.tenant_id;
        next();
    });
};

// Middleware opzionale di autenticazione (non blocca se non c'è token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        req.tenantId = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
            req.tenantId = null;
        } else {
            req.user = user;
            req.tenantId = user.tenant_id;
        }
        next();
    });
};

// Utility functions
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            tenant_id: user.tenant_id,
            role: user.role,
            subscription_status: user.subscription_status,
            subscription_end_date: user.subscription_end_date
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    hashPassword,
    comparePassword,
    generateResetToken
};
