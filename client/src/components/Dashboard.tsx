import React, { useState, useEffect } from 'react';
import { DatiMensili } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, getNomeeMese, getMeseCorrente } from '../utils/formatters';
import { TrendingUp, TrendingDown, Wallet, Calculator, Calendar, Euro } from 'lucide-react';

interface DashboardProps {
    meseSelezionato: number;
    annoSelezionato: number;
    onDatiAggiornati: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ meseSelezionato, annoSelezionato, onDatiAggiornati }) => {
    const [dati, setDati] = useState<DatiMensili | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        caricaDati();
    }, [meseSelezionato, annoSelezionato]);

    const caricaDati = async () => {
        try {
            setLoading(true);
            setError(null);
            const datiMensili = await apiService.getDatiMensili(annoSelezionato, meseSelezionato);
            setDati(datiMensili);
        } catch (err) {
            setError('Errore nel caricamento dei dati');
            console.error('Errore caricamento dati:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button
                    onClick={caricaDati}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                    Riprova
                </button>
            </div>
        );
    }

    if (!dati) return null;

    const { calcoli } = dati;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
                <div className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8" />
                    <div>
                        <h2 className="text-2xl font-bold">
                            {getNomeeMese(meseSelezionato)} {annoSelezionato}
                        </h2>
                        <p className="text-blue-100">Riepilogo finanziario mensile</p>
                    </div>
                </div>
            </div>

            {/* Cards principali */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Entrate */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Entrate</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(dati.entrate.totale)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </div>

                {/* Tasse */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Tasse ({calcoli.percentualeTasse}%)
                                {calcoli.dettaglioTasse && (
                                    <span className="text-xs text-gray-500 block">
                                        IRPEF: {calcoli.dettaglioTasse.irpef}% | INPS: {calcoli.dettaglioTasse.inps}% | Coeff: {calcoli.dettaglioTasse.coefficiente}%
                                    </span>
                                )}
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(calcoli.tasseDaPagare)}
                            </p>
                        </div>
                        <Euro className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                {/* Spese */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Spese</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(dati.spese.totale)}
                            </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                </div>

                {/* Stipendio Disponibile */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Stipendio Disponibile</p>
                            <p className={`text-2xl font-bold ${calcoli.stipendioDisponibile >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(calcoli.stipendioDisponibile)}
                            </p>
                        </div>
                        <Wallet className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Dettagli calcoli */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Dettaglio Calcoli</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Entrate nette:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(calcoli.entrateNette)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">- Tasse e INPS ({calcoli.percentualeTasse}%):</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(calcoli.tasseDaPagare)}</span>
                    </div>

                    {calcoli.dettaglioTasse && (
                        <div className="ml-4 space-y-1 text-sm text-gray-500">
                            <div className="flex justify-between">
                                <span>• Reddito imponibile (coeff. {calcoli.dettaglioTasse.coefficiente}%):</span>
                                <span>{formatCurrency((dati.entrate.totale * calcoli.dettaglioTasse.coefficiente) / 100)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>• IRPEF ({calcoli.dettaglioTasse.irpef}%):</span>
                                <span>{formatCurrency(dati.entrate.totale * calcoli.dettaglioTasse.irpef / 100)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>• INPS ({calcoli.dettaglioTasse.inps}%):</span>
                                <span>{formatCurrency(dati.entrate.totale * calcoli.dettaglioTasse.inps / 100)}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">= Disponibile dopo tasse:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(calcoli.disponibileDopoTasse)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">- Spese del mese:</span>
                        <span className="font-semibold text-orange-600">-{formatCurrency(dati.spese.totale)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">= Disponibile dopo spese:</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(calcoli.disponibileDopSpese)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">- Prelievi già effettuati:</span>
                        <span className="font-semibold text-gray-600">-{formatCurrency(dati.prelievi.totale)}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg">
                        <span className="text-lg font-semibold text-gray-800">Stipendio disponibile:</span>
                        <span className={`text-xl font-bold ${calcoli.stipendioDisponibile >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(calcoli.stipendioDisponibile)}
                        </span>
                    </div>
                </div>

                {calcoli.stipendioDisponibile < 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">
                            ⚠️ Attenzione: Il saldo è negativo. Hai speso più di quanto disponibile dopo le tasse.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
