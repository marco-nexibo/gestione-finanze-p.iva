import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, Save, Eye, EyeOff, LogOut, AlertCircle, CheckCircle } from 'lucide-react';

const AccountSettings: React.FC = () => {
    const { user, updateProfile, changePassword, logout } = useAuth();
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
        </div>
    );
};

export default AccountSettings;
