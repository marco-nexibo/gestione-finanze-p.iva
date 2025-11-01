import React, { useState, useEffect } from 'react';
import { ProfiloFiscale, GestioneInps } from '../types';
import { apiService } from '../services/api';
import { Settings, Calculator, Percent, Building2, User } from 'lucide-react';
import AccountSettings from './AccountSettings';

const Impostazioni: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'profilo' | 'account'>('profilo');
    const [profiloFiscale, setProfiloFiscale] = useState<ProfiloFiscale>({
        aliquotaIrpef: 15,
        coefficienteRedditivita: 67,
        gestioneInps: 'gestione_separata'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [messaggio, setMessaggio] = useState<{ tipo: 'success' | 'error', testo: string } | null>(null);

    // Carica il profilo fiscale all'avvio
    useEffect(() => {
        caricaProfiloFiscale();
    }, []);

    const caricaProfiloFiscale = async () => {
        try {
            setLoading(true);
            console.log('Caricamento profilo fiscale...');
            const profilo = await apiService.getProfiloFiscale();
            console.log('Profilo fiscale caricato:', profilo);

            // Se il profilo è vuoto o ha valori null, usa i valori di default
            const profiloConDefault = {
                aliquotaIrpef: profilo.aliquotaIrpef || 15,
                coefficienteRedditivita: profilo.coefficienteRedditivita || 67,
                gestioneInps: profilo.gestioneInps || 'gestione_separata'
            };

            setProfiloFiscale(profiloConDefault);
        } catch (error) {
            console.error('Errore nel caricamento del profilo fiscale:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nel caricamento del profilo fiscale' });
        } finally {
            setLoading(false);
        }
    };

    const handleAliquotaIrpefChange = (aliquota: number) => {
        setProfiloFiscale(prev => ({
            ...prev,
            aliquotaIrpef: aliquota
        }));
    };

    const handleCoefficienteChange = (coefficiente: number) => {
        setProfiloFiscale(prev => ({
            ...prev,
            coefficienteRedditivita: coefficiente
        }));
    };

    const handleGestioneInpsChange = (gestione: GestioneInps) => {
        setProfiloFiscale(prev => ({
            ...prev,
            gestioneInps: gestione
        }));
    };

    const salvaProfilo = async () => {
        try {
            setSaving(true);
            setMessaggio(null);

            // Validazione dei dati
            if (!profiloFiscale.aliquotaIrpef || !profiloFiscale.coefficienteRedditivita || !profiloFiscale.gestioneInps) {
                setMessaggio({ tipo: 'error', testo: 'Compila tutti i campi del profilo fiscale' });
                return;
            }

            console.log('Salvataggio profilo fiscale:', profiloFiscale);
            await apiService.salvaProfiloFiscale(profiloFiscale);
            setMessaggio({ tipo: 'success', testo: 'Profilo fiscale salvato con successo!' });

            // Auto-rimuovi il messaggio dopo 3 secondi
            setTimeout(() => setMessaggio(null), 3000);
        } catch (error) {
            console.error('Errore nel salvataggio del profilo fiscale:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nel salvataggio del profilo fiscale' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header con tabs */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <Settings className="h-8 w-8" />
                    <div>
                        <h2 className="text-2xl font-bold">Impostazioni</h2>
                        <p className="text-purple-100">Configura il tuo profilo fiscale e account</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mt-6">
                    <button
                        onClick={() => setActiveSection('profilo')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${activeSection === 'profilo'
                            ? 'bg-white text-purple-600 font-medium'
                            : 'bg-purple-700 text-purple-100 hover:bg-purple-600'
                            }`}
                    >
                        <Building2 className="h-4 w-4" />
                        <span>Profilo Fiscale</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('account')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${activeSection === 'account'
                            ? 'bg-white text-purple-600 font-medium'
                            : 'bg-purple-700 text-purple-100 hover:bg-purple-600'
                            }`}
                    >
                        <User className="h-4 w-4" />
                        <span>Account</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeSection === 'profilo' && (
                <>
                    {/* Messaggi di feedback */}
                    {messaggio && (
                        <div className={`p-4 rounded-lg ${messaggio.tipo === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            {messaggio.testo}
                        </div>
                    )}

                    {/* Profilo Fiscale */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <Building2 className="h-6 w-6 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Profilo Fiscale Forfettario</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Aliquota IRPEF */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Aliquota imposta sostitutiva (IRPEF)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleAliquotaIrpefChange(5)}
                                        className={`p-4 border-2 rounded-lg text-center transition-colors ${profiloFiscale.aliquotaIrpef === 5
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-lg font-semibold">5%</div>
                                        <div className="text-sm text-gray-600">Startup innovative</div>
                                    </button>
                                    <button
                                        onClick={() => handleAliquotaIrpefChange(15)}
                                        className={`p-4 border-2 rounded-lg text-center transition-colors ${profiloFiscale.aliquotaIrpef === 15
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-lg font-semibold">15%</div>
                                        <div className="text-sm text-gray-600">Regime ordinario</div>
                                    </button>
                                </div>
                            </div>

                            {/* Coefficiente di redditività */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    <div className="flex items-center space-x-2">
                                        <Percent className="h-4 w-4" />
                                        <span>Coefficiente di redditività in base al tuo codice ATECO</span>
                                    </div>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[40, 54, 62, 67, 78, 86].map((coeff) => (
                                        <button
                                            key={coeff}
                                            onClick={() => handleCoefficienteChange(coeff)}
                                            className={`p-3 border-2 rounded-lg text-center transition-colors ${profiloFiscale.coefficienteRedditivita === coeff
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {coeff}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gestione INPS */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Gestione INPS
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleGestioneInpsChange('gestione_separata')}
                                        className={`p-4 border-2 rounded-lg text-left transition-colors ${profiloFiscale.gestioneInps === 'gestione_separata'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-medium">Gestione Separata</div>
                                        <div className="text-sm text-gray-600">Liberi professionisti</div>
                                    </button>
                                    <button
                                        onClick={() => handleGestioneInpsChange('artigiani_commercianti')}
                                        className={`p-4 border-2 rounded-lg text-left transition-colors ${profiloFiscale.gestioneInps === 'artigiani_commercianti'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-medium">Artigiani e Commercianti</div>
                                        <div className="text-sm text-gray-600">Ditte individuali</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pulsante salva */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={salvaProfilo}
                                disabled={saving}
                                className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 ${saving
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Salvataggio...</span>
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="h-5 w-5" />
                                        <span>Salva Profilo Fiscale</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Riepilogo profilo */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Profilo</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Aliquota IRPEF:</span>
                                <span className="font-medium">{profiloFiscale.aliquotaIrpef}%</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Coefficiente di redditività:</span>
                                <span className="font-medium">{profiloFiscale.coefficienteRedditivita}%</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Gestione INPS:</span>
                                <span className="font-medium">
                                    {profiloFiscale.gestioneInps === 'gestione_separata'
                                        ? 'Gestione Separata'
                                        : 'Artigiani e Commercianti'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeSection === 'account' && (
                <AccountSettings />
            )}
        </div>
    );
};

export default Impostazioni;