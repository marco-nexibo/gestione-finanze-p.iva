import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, Save, Eye, EyeOff, LogOut, AlertCircle, CheckCircle, Trash2, X } from 'lucide-react';

const AccountSettings: React.FC = () => {
    const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile form
    const [profileData, setProfileData] = useState({
        nome: user?.nome || '',
        cognome: user?.cognome || ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);

        // Validazione
        if (!profileData.nome.trim() || !profileData.cognome.trim()) {
            setProfileMessage({ type: 'error', text: 'Nome e cognome sono obbligatori' });
            setProfileLoading(false);
            return;
        }

        try {
            await updateProfile(profileData.nome.trim(), profileData.cognome.trim());
            setProfileMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
            setTimeout(() => setProfileMessage(null), 3000);
        } catch (error: any) {
            setProfileMessage({
                type: 'error',
                text: error.response?.data?.error || 'Errore nell\'aggiornamento del profilo'
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage(null);

        // Validazioni
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Tutti i campi sono obbligatori' });
            setPasswordLoading(false);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Le nuove password non coincidono' });
            setPasswordLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'La nuova password deve essere di almeno 8 caratteri' });
            setPasswordLoading(false);
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            setPasswordMessage({ type: 'error', text: 'La nuova password deve essere diversa da quella corrente' });
            setPasswordLoading(false);
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Password cambiata con successo!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMessage(null), 3000);
        } catch (error: any) {
            setPasswordMessage({
                type: 'error',
                text: error.response?.data?.error || 'Errore nel cambio password'
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Sei sicuro di voler uscire?')) {
            logout();
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError('');

        try {
            // Per utenti Google, invia stringa vuota (non verificherà la password)
            // Per utenti normali, invia la password
            const passwordToSend = user?.email_verified ? '' : deletePassword;
            await deleteAccount(passwordToSend);
            // L'eliminazione è gestita nel AuthContext che fa logout automaticamente
        } catch (error: any) {
            setDeleteError(error.response?.data?.error || 'Errore nell\'eliminazione dell\'account');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <User className="h-8 w-8" />
                        <div>
                            <h3 className="text-xl font-bold">Account</h3>
                            <p className="text-green-100">Gestisci le informazioni del tuo account</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Esci</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Profilo</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'password'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4" />
                            <span>Password</span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Personali</h4>

                            {profileMessage && (
                                <div className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${profileMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                    }`}>
                                    {profileMessage.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span>{profileMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                {/* Email (read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
                                </div>

                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.nome}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, nome: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                        required
                                        disabled={profileLoading}
                                        placeholder="Il tuo nome"
                                    />
                                </div>

                                {/* Cognome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cognome
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.cognome}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, cognome: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                        required
                                        disabled={profileLoading}
                                        placeholder="Il tuo cognome"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                                >
                                    {profileLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Salvataggio...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Salva Modifiche</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'password' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cambia Password</h4>

                            {passwordMessage && (
                                <div className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${passwordMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                                    }`}>
                                    {passwordMessage.type === 'success' ? (
                                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span>{passwordMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {/* Password Corrente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password Corrente
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                            required
                                            disabled={passwordLoading}
                                            placeholder="La tua password corrente"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            disabled={passwordLoading}
                                        >
                                            {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Nuova Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nuova Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                            required
                                            minLength={8}
                                            disabled={passwordLoading}
                                            placeholder="La tua nuova password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            disabled={passwordLoading}
                                        >
                                            {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri</p>
                                </div>

                                {/* Conferma Nuova Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Conferma Nuova Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                            required
                                            minLength={8}
                                            disabled={passwordLoading}
                                            placeholder="Conferma la nuova password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            disabled={passwordLoading}
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Aggiornamento...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4" />
                                            <span>Cambia Password</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Sezione Elimina Account */}
            <div className="mt-8 pt-8 border-t-2 border-red-200">
                <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-start space-x-3 mb-4">
                        <Trash2 className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h4 className="text-lg font-semibold text-red-900 mb-2">Area Pericolosa</h4>
                            <p className="text-sm text-red-700">
                                Una volta eliminato il tuo account, tutti i tuoi dati verranno permanentemente rimossi.
                                Questa azione non può essere annullata.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={showDeleteModal}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-colors flex items-center space-x-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Elimina Account</span>
                    </button>
                </div>
            </div>

            {/* Modal Conferma Eliminazione */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-red-900 flex items-center space-x-2">
                                <Trash2 className="h-6 w-6" />
                                <span>Conferma Eliminazione Account</span>
                            </h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-center text-gray-700 mb-4">
                                Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.
                            </p>

                            {/* Errore */}
                            {deleteError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center space-x-2">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            {/* Input - varia in base al tipo utente */}
                            {user?.email_verified ? (
                                // Utente Google - conferma con testo
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Digita "ELIMINA" per confermare
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        placeholder="ELIMINA"
                                        disabled={deleteLoading}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                // Utente normale - conferma con password
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Inserisci la tua password per confermare
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                            placeholder="La tua password"
                                            disabled={deleteLoading}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword('');
                                    setDeleteConfirmText('');
                                    setDeleteError('');
                                }}
                                disabled={deleteLoading}
                                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || (user?.email_verified ? deleteConfirmText !== 'ELIMINA' : !deletePassword)}
                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Eliminazione...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        <span>Elimina Definitivamente</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;
