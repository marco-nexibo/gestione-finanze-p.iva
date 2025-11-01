import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nome: '',
        cognome: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [resetToken, setResetToken] = useState('');

    const { login, register, forgotPassword, loginWithGoogle } = useAuth();

    // Google Login handler
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setError('');
                setLoading(true);
                await loginWithGoogle(tokenResponse.access_token);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Errore durante il login con Google');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Errore durante il login con Google');
        },
        flow: 'implicit'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login({
                    email: formData.email,
                    password: formData.password
                });
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Le password non coincidono');
                    return;
                }

                if (formData.password.length < 8) {
                    setError('La password deve essere di almeno 8 caratteri');
                    return;
                }

                if (!formData.nome.trim() || !formData.cognome.trim()) {
                    setError('Nome e cognome sono obbligatori');
                    return;
                }

                await register({
                    email: formData.email,
                    password: formData.password,
                    nome: formData.nome.trim(),
                    cognome: formData.cognome.trim()
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Errore durante l\'autenticazione');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!formData.email) {
            setError('Inserisci la tua email per recuperare la password');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await forgotPassword(formData.email);
            setForgotPasswordMessage(response.message);

            // In development, mostra il token per testing
            if (response.resetToken) {
                setResetToken(response.resetToken);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Errore nell\'invio della richiesta');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            nome: '',
            cognome: '',
            confirmPassword: ''
        });
        setError('');
        setForgotPasswordMessage('');
        setResetToken('');
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    const backToLogin = () => {
        setShowForgotPassword(false);
        resetForm();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {showForgotPassword ? 'Recupera Password' : isLogin ? 'Accedi' : 'Registrati'}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {showForgotPassword
                            ? 'Inserisci la tua email per recuperare la password'
                            : isLogin
                                ? 'Accedi al tuo account per gestire le finanze'
                                : 'Crea un nuovo account per iniziare'
                        }
                    </p>
                </div>

                {/* Error Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success Messages */}
                {forgotPasswordMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        <p>{forgotPasswordMessage}</p>
                        {resetToken && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <p className="font-medium text-yellow-800">Token per testing (solo in development):</p>
                                <p className="font-mono text-yellow-700 break-all">{resetToken}</p>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="la-tua-email@example.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {!showForgotPassword && (
                        <>
                            {/* Nome e Cognome (solo registrazione) */}
                            {!isLogin && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.nome}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                placeholder="Mario"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cognome
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cognome}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Rossi"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="La tua password"
                                        required
                                        minLength={8}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {!isLogin && (
                                    <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri</p>
                                )}
                            </div>

                            {/* Conferma Password (solo registrazione) */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Conferma Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Conferma la password"
                                            required
                                            minLength={8}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit Button */}
                    <button
                        type={showForgotPassword ? 'button' : 'submit'}
                        onClick={showForgotPassword ? handleForgotPassword : undefined}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <span>
                                    {showForgotPassword ? 'Invia Richiesta' : isLogin ? 'Accedi' : 'Registrati'}
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    {/* Google Login Button */}
                    {!showForgotPassword && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Oppure</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleGoogleLogin()}
                                disabled={loading}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-200"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>{isLogin ? 'Accedi' : 'Registrati'} con Google</span>
                            </button>
                        </>
                    )}
                </form>

                {/* Links */}
                <div className="mt-6 text-center space-y-2">
                    {!showForgotPassword && (
                        <>
                            {isLogin && (
                                <button
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    disabled={loading}
                                >
                                    Non ricordi la password?
                                </button>
                            )}

                            <div className="text-sm text-gray-600">
                                {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
                                <button
                                    onClick={switchMode}
                                    className="ml-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                    disabled={loading}
                                >
                                    {isLogin ? 'Registrati' : 'Accedi'}
                                </button>
                            </div>
                        </>
                    )}

                    {showForgotPassword && (
                        <button
                            onClick={backToLogin}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            disabled={loading}
                        >
                            Torna al login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
