import React, { useState, useEffect } from 'react';
import { Prelievo } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, getNomeeMese } from '../utils/formatters';
import { Wallet, Plus, Trash2, AlertCircle } from 'lucide-react';

interface GestionePrelievi {
    meseSelezionato: number;
    annoSelezionato: number;
    prelievi: Prelievo[];
    stipendioDisponibile: number;
    onPrelieviAggiornati: () => void;
}

const GestionePrelievi: React.FC<GestionePrelievi> = ({
    meseSelezionato,
    annoSelezionato,
    prelievi: propPrelievi,
    stipendioDisponibile: propStipendioDisponibile,
    onPrelieviAggiornati
}) => {
    const [nuovoPrelievo, setNuovoPrelievo] = useState({
        importo: '',
        descrizione: ''
    });
    const [loading, setLoading] = useState(false);
    const [messaggio, setMessaggio] = useState<{ tipo: 'success' | 'error'; testo: string } | null>(null);
    const [prelievi, setPrelievi] = useState<Prelievo[]>(propPrelievi);
    const [stipendioDisponibile, setStipendioDisponibile] = useState<number>(propStipendioDisponibile);
    const [dataLoading, setDataLoading] = useState(false);

    // Aggiorna i prelievi quando cambiano le props
    useEffect(() => {
        setPrelievi(propPrelievi);
        setStipendioDisponibile(propStipendioDisponibile);
    }, [propPrelievi, propStipendioDisponibile]);

    // Carica i dati quando cambiano mese/anno (se non vengono passati dalle props)
    useEffect(() => {
        if (propPrelievi.length === 0) {
            caricaDati();
        }
    }, [meseSelezionato, annoSelezionato]);

    const caricaDati = async () => {
        try {
            setDataLoading(true);
            const datiMensili = await apiService.getDatiMensili(annoSelezionato, meseSelezionato);
            setPrelievi(datiMensili.prelievi.lista);
            setStipendioDisponibile(datiMensili.calcoli.stipendioDisponibile);
        } catch (error) {
            console.error('Errore nel caricamento dei prelievi:', error);
        } finally {
            setDataLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nuovoPrelievo.importo || parseFloat(nuovoPrelievo.importo) <= 0) {
            setMessaggio({ tipo: 'error', testo: 'Inserisci un importo valido' });
            return;
        }

        const importoPrelievo = parseFloat(nuovoPrelievo.importo);
        if (importoPrelievo > stipendioDisponibile) {
            setMessaggio({
                tipo: 'error',
                testo: `L'importo supera lo stipendio disponibile (${formatCurrency(stipendioDisponibile)})`
            });
            return;
        }

        try {
            setLoading(true);
            setMessaggio(null);

            await apiService.aggiungiPrelievo(
                meseSelezionato,
                annoSelezionato,
                importoPrelievo,
                nuovoPrelievo.descrizione
            );

            setNuovoPrelievo({ importo: '', descrizione: '' });
            setMessaggio({ tipo: 'success', testo: 'Prelievo registrato correttamente!' });
            onPrelieviAggiornati();

            setTimeout(() => setMessaggio(null), 3000);
        } catch (error) {
            console.error('Errore nell\'aggiungere il prelievo:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nell\'registrare il prelievo' });
        } finally {
            setLoading(false);
        }
    };

    const handleEliminaPrelievo = async (id: number) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo prelievo?')) {
            return;
        }

        try {
            await apiService.eliminaPrelievo(id);
            setMessaggio({ tipo: 'success', testo: 'Prelievo eliminato correttamente!' });
            onPrelieviAggiornati();

            setTimeout(() => setMessaggio(null), 3000);
        } catch (error) {
            console.error('Errore nell\'eliminare il prelievo:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nell\'eliminare il prelievo' });
        }
    };

    const totalePrelievi = prelievi.reduce((sum, prelievo) => sum + prelievo.importo, 0);
    const rimanente = stipendioDisponibile + totalePrelievi;

    if (dataLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Caricamento prelievi...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Wallet className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Prelievi - {getNomeeMese(meseSelezionato)} {annoSelezionato}
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Prelievi effettuati</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(totalePrelievi)}</p>
                </div>
            </div>

            {/* Info stipendio disponibile */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-blue-800 font-medium">Stipendio ancora disponibile:</span>
                    <span className={`text-xl font-bold ${stipendioDisponibile >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(stipendioDisponibile)}
                    </span>
                </div>
                {stipendioDisponibile < 0 && (
                    <p className="text-red-600 text-sm mt-2">
                        ⚠️ Hai prelevato più del disponibile
                    </p>
                )}
            </div>

            {/* Form per nuovo prelievo */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Registra nuovo prelievo</span>
                </h4>

                <div>
                    <label htmlFor="importo-prelievo" className="block text-sm font-medium text-gray-700 mb-1">
                        Importo *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="importo-prelievo"
                            step="0.01"
                            min="0"
                            max={rimanente > 0 ? rimanente : undefined}
                            value={nuovoPrelievo.importo}
                            onChange={(e) => setNuovoPrelievo({ ...nuovoPrelievo, importo: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                    </div>
                    {rimanente > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            Massimo disponibile: {formatCurrency(rimanente)}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="descrizione-prelievo" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrizione
                    </label>
                    <input
                        type="text"
                        id="descrizione-prelievo"
                        value={nuovoPrelievo.descrizione}
                        onChange={(e) => setNuovoPrelievo({ ...nuovoPrelievo, descrizione: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Stipendio, rimborso, ecc..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !nuovoPrelievo.importo || stipendioDisponibile <= 0}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Registrando...' : 'Registra Prelievo'}</span>
                </button>

                {stipendioDisponibile <= 0 && (
                    <p className="text-red-600 text-sm text-center">
                        Non hai stipendio disponibile per effettuare prelievi
                    </p>
                )}
            </form>

            {/* Lista prelievi */}
            <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Prelievi del mese ({prelievi.length})</h4>

                {prelievi.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nessun prelievo registrato per questo mese</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {prelievi.map((prelievo) => (
                            <div key={prelievo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-blue-600">
                                            {formatCurrency(prelievo.importo)}
                                        </span>
                                    </div>
                                    {prelievo.descrizione && (
                                        <p className="text-sm text-gray-600 mt-1">{prelievo.descrizione}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(prelievo.data_inserimento).toLocaleDateString('it-IT')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleEliminaPrelievo(prelievo.id)}
                                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Elimina prelievo"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Messaggi */}
            {messaggio && (
                <div className={`mt-4 p-3 rounded-md flex items-center space-x-2 ${messaggio.tipo === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{messaggio.testo}</span>
                </div>
            )}
        </div>
    );
};

export default GestionePrelievi;
