import React, { useState } from 'react';
import { CheckCircle, Info, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
    onSkip?: () => void;
}

interface ProfiloFiscale {
    aliquotaIrpef: number;
    coefficienteRedditivita: number;
    gestioneInps: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [profiloFiscale, setProfiloFiscale] = useState<ProfiloFiscale>({
        aliquotaIrpef: 5,
        coefficienteRedditivita: 78,
        gestioneInps: 'gestione_separata'
    });

    const steps = [
        {
            title: "Benvenuto in ForfettApp! 🎉",
            content: (
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">👋</div>
                    <p className="text-lg text-gray-600">
                        Ti aiuteremo a configurare il tuo profilo fiscale per calcolare automaticamente le tue tasse.
                    </p>
                    <p className="text-sm text-gray-500">
                        Questo processo richiederà solo 2 minuti e ti permetterà di utilizzare l'app al meglio.
                    </p>
                </div>
            )
        },
        {
            title: "Aliquota IRPEF",
            content: (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900">Cos'è l'Aliquota IRPEF?</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    È la percentuale di tasse sul reddito che paghi ogni anno.
                                    Per il regime forfettario è generalmente del 5% per i primi 5 anni, poi 15%.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Seleziona la tua aliquota IRPEF
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="aliquotaIrpef"
                                    value={5}
                                    checked={profiloFiscale.aliquotaIrpef === 5}
                                    onChange={(e) => setProfiloFiscale({ ...profiloFiscale, aliquotaIrpef: parseInt(e.target.value) })}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <div>
                                    <div className="font-medium">5% - Primi 5 anni</div>
                                    <div className="text-sm text-gray-500">Se hai iniziato l'attività da meno di 5 anni</div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="aliquotaIrpef"
                                    value={15}
                                    checked={profiloFiscale.aliquotaIrpef === 15}
                                    onChange={(e) => setProfiloFiscale({ ...profiloFiscale, aliquotaIrpef: parseInt(e.target.value) })}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <div>
                                    <div className="font-medium">15% - Oltre 5 anni</div>
                                    <div className="text-sm text-gray-500">Se hai iniziato l'attività da più di 5 anni</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Coefficiente di Redditività",
            content: (
                <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Info className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-green-900">Cos'è il Coefficiente di Redditività?</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    È la percentuale del tuo fatturato che viene considerata come reddito imponibile.
                                    Varia in base al tipo di attività che svolgi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Seleziona il coefficiente per la tua attività
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { value: 40, label: "40% - Professioni", desc: "Medici, avvocati, commercialisti" },
                                { value: 54, label: "54% - Servizi alla persona", desc: "Parrucchieri, estetisti, personal trainer" },
                                { value: 62, label: "62% - Servizi alle imprese", desc: "Consulenze tecniche, servizi di supporto" },
                                { value: 67, label: "67% - Commercio", desc: "Vendita di prodotti, e-commerce" },
                                { value: 78, label: "78% - Servizi", desc: "Consulenze, servizi informatici, marketing" },
                                { value: 86, label: "86% - Altro", desc: "Altre attività non specificate" }
                            ].map((option) => (
                                <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="coefficienteRedditivita"
                                        value={option.value}
                                        checked={profiloFiscale.coefficienteRedditivita === option.value}
                                        onChange={(e) => setProfiloFiscale({ ...profiloFiscale, coefficienteRedditivita: parseInt(e.target.value) })}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">{option.label}</div>
                                        <div className="text-sm text-gray-500">{option.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Gestione INPS",
            content: (
                <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-purple-900">Cos'è la Gestione INPS?</h3>
                                <p className="text-sm text-purple-700 mt-1">
                                    È il sistema di previdenza sociale che determina quanto paghi per la pensione.
                                    La maggior parte dei forfettari usa la gestione ordinaria.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Seleziona la tua gestione INPS
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="gestioneInps"
                                    value="artigiani_commercianti"
                                    checked={profiloFiscale.gestioneInps === 'artigiani_commercianti'}
                                    onChange={(e) => setProfiloFiscale({ ...profiloFiscale, gestioneInps: e.target.value })}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <div>
                                    <div className="font-medium">Artigiani e Commercianti</div>
                                    <div className="text-sm text-gray-500">Ditte individuali (24%)</div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="gestioneInps"
                                    value="gestione_separata"
                                    checked={profiloFiscale.gestioneInps === 'gestione_separata'}
                                    onChange={(e) => setProfiloFiscale({ ...profiloFiscale, gestioneInps: e.target.value })}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <div>
                                    <div className="font-medium">Gestione Separata</div>
                                    <div className="text-sm text-gray-500">Liberi professionisti</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Completamento! 🎉",
            content: (
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900">Profilo fiscale configurato!</h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                        <h4 className="font-medium mb-2">Riepilogo configurazione:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Aliquota IRPEF: {profiloFiscale.aliquotaIrpef}%</li>
                            <li>• Coefficiente di redditività: {profiloFiscale.coefficienteRedditivita}%</li>
                            <li>• Gestione INPS: {profiloFiscale.gestioneInps}</li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-500">
                        Ora ForfettApp calcolerà automaticamente le tue tasse in base a questi parametri!
                    </p>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        try {
            console.log('Inizio completamento onboarding...', profiloFiscale);
            const token = localStorage.getItem('auth_token');
            console.log('Token trovato:', token ? 'Sì' : 'No');

            const response = await fetch('http://localhost:3001/api/auth/complete-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profiloFiscale)
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (response.ok) {
                console.log('Onboarding completato con successo');
                // Aggiorna l'utente nel localStorage
                const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
                currentUser.onboarding_completed = true;
                localStorage.setItem('auth_user', JSON.stringify(currentUser));
                onComplete();
            } else {
                console.error('Errore nel completamento onboarding:', responseData);
                alert('Errore nel completamento: ' + responseData.error);
            }
        } catch (error) {
            console.error('Errore:', error);
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            alert('Errore di connessione: ' + errorMessage);
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h1>
                        <div className="text-sm text-gray-500">
                            {currentStep + 1} di {steps.length}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Pulsante di debug temporaneo */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }}
                            className="text-xs bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
                        >
                            🚨 Reset Completo (Debug)
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {steps[currentStep].content}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6">
                    <div className="flex justify-between">
                        <div className="flex space-x-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Indietro</span>
                            </button>

                            {currentStep === 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Cliccato Salta per ora - chiamando onSkip');
                                        if (onSkip) {
                                            onSkip();
                                        }
                                    }}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    Salta per ora
                                </button>
                            )}
                        </div>

                        {currentStep === steps.length - 1 ? (
                            <button
                                onClick={handleComplete}
                                disabled={isCompleting}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${isCompleting
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>{isCompleting ? 'Completamento...' : 'Completa Setup'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Avanti</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
