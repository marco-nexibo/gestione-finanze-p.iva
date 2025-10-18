// Middleware per gestione ruoli e autorizzazioni
const { authenticateToken } = require('../auth');

// Middleware per verificare il ruolo dell'utente
const requireRole = (roles) => {
    return (req, res, next) => {
        // Prima verifica l'autenticazione
        authenticateToken(req, res, () => {
            // Se l'utente è admin, può fare tutto
            if (req.user.role === 'admin') {
                return next();
            }

            // Verifica se il ruolo dell'utente è autorizzato
            if (roles.includes(req.user.role)) {
                return next();
            }

            // Ruolo non autorizzato
            res.status(403).json({
                error: 'Accesso negato. Ruolo insufficiente.',
                required_roles: roles,
                user_role: req.user.role
            });
        });
    };
};

// Middleware per verificare se l'utente è il proprietario del tenant
const requireTenantOwner = (req, res, next) => {
    // Admin può accedere a tutto
    if (req.user.role === 'admin') {
        return next();
    }

    // Owner può accedere solo ai suoi dati
    if (req.user.role === 'owner') {
        return next();
    }

    // Altri ruoli non possono accedere
    res.status(403).json({
        error: 'Accesso negato. Solo il proprietario può accedere a questi dati.',
        user_role: req.user.role
    });
};

// Middleware per verificare lo stato dell'abbonamento
const requireActiveSubscription = (req, res, next) => {
    // Admin non ha limitazioni
    if (req.user.role === 'admin') {
        return next();
    }

    // Verifica lo stato dell'abbonamento dal token
    const subscriptionStatus = req.user.subscription_status;
    const subscriptionEndDate = req.user.subscription_end_date;

    // Se l'abbonamento è attivo
    if (subscriptionStatus === 'active') {
        return next();
    }

    // Se è in trial, verifica la scadenza
    if (subscriptionStatus === 'trial') {
        const now = new Date();
        const endDate = new Date(subscriptionEndDate);

        if (now < endDate) {
            return next();
        } else {
            // Trial scaduto
            return res.status(402).json({
                error: 'Trial scaduto. È necessario sottoscrivere un abbonamento.',
                subscription_status: 'expired',
                subscription_end_date: subscriptionEndDate
            });
        }
    }

    // Abbonamento scaduto o cancellato
    res.status(402).json({
        error: 'Abbonamento non attivo. È necessario sottoscrivere un abbonamento.',
        subscription_status: subscriptionStatus,
        subscription_end_date: subscriptionEndDate
    });
};

// Middleware combinato per operazioni sui dati finanziari
const requireFinancialAccess = (req, res, next) => {
    // Prima verifica l'autenticazione e il ruolo
    requireTenantOwner(req, res, () => {
        // Poi verifica l'abbonamento
        requireActiveSubscription(req, res, next);
    });
};

// Middleware per operazioni admin
const requireAdmin = requireRole(['admin']);

// Middleware per operazioni owner
const requireOwner = requireRole(['admin', 'owner']);

module.exports = {
    requireRole,
    requireTenantOwner,
    requireActiveSubscription,
    requireFinancialAccess,
    requireAdmin,
    requireOwner
};
