import React, { useState, useEffect } from 'react';
import { Spesa } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, getNomeeMese } from '../utils/formatters';
import { ShoppingCart, Plus, Trash2, AlertCircle } from 'lucide-react';

interface GestioneSpeseProps {
    meseSelezionato: number;
    annoSelezionato: number;
    spese: Spesa[];
    onSpeseAggiornate: () => void;
}

const GestioneSpese: React.FC<GestioneSpeseProps> = ({
    meseSelezionato,
    annoSelezionato,
    spese: propSpese,
    onSpeseAggiornate
}) => {
    const [nuovaSpesa, setNuovaSpesa] = useState({
        importo: '',
        categoria: '',
        descrizione: ''
    });
    const [loading, setLoading] = useState(false);
    const [messaggio, setMessaggio] = useState<{ tipo: 'success' | 'error'; testo: string } | null>(null);
    const [spese, setSpese] = useState<Spesa[]>(propSpese);
    const [dataLoading, setDataLoading] = useState(false);

    // Aggiorna le spese quando cambiano le props
    useEffect(() => {
        setSpese(propSpese);
    }, [propSpese]);

    // Carica i dati quando cambiano mese/anno (se non vengono passati dalle props)
    useEffect(() => {
        if (propSpese.length === 0) {
            caricaDati();
        }
    }, [meseSelezionato, annoSelezionato]);

    const caricaDati = async () => {
        try {
            setDataLoading(true);
            const datiMensili = await apiService.getDatiMensili(annoSelezionato, meseSelezionato);
            setSpese(datiMensili.spese.lista);
        } catch (error) {
            console.error('Errore nel caricamento delle spese:', error);
        } finally {
            setDataLoading(false);
        }
    };

    const categorieComuni = [
        'Strumenti di lavoro',
        'Software/Licenze',
        'Formazione',
        'Marketing',
        'Trasporti',
        'Ufficio/Casa',
        'Collaboratori',
        'Hardware',
        'Assicurazioni/Fondi Pensione',
        'Bollette',
        'F24',
        'Altro'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nuovaSpesa.importo || parseFloat(nuovaSpesa.importo) <= 0) {
            setMessaggio({ tipo: 'error', testo: 'Inserisci un importo valido' });
            return;
        }

        try {
            setLoading(true);
            setMessaggio(null);

            await apiService.aggiungiSpesa(
                meseSelezionato,
                annoSelezionato,
                parseFloat(nuovaSpesa.importo),
                nuovaSpesa.categoria,
                nuovaSpesa.descrizione
            );

            setNuovaSpesa({ importo: '', categoria: '', descrizione: '' });
            setMessaggio({ tipo: 'success', testo: 'Spesa aggiunta correttamente!' });
            onSpeseAggiornate();

            setTimeout(() => setMessaggio(null), 3000);
        } catch (error) {
            console.error('Errore nell\'aggiungere la spesa:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nell\'aggiungere la spesa' });
        } finally {
            setLoading(false);
        }
    };

    const handleEliminaSpesa = async (id: number) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa spesa?')) {
            return;
        }

        try {
            await apiService.eliminaSpesa(id);
            setMessaggio({ tipo: 'success', testo: 'Spesa eliminata correttamente!' });
            onSpeseAggiornate();

            setTimeout(() => setMessaggio(null), 3000);
        } catch (error) {
            console.error('Errore nell\'eliminare la spesa:', error);
            setMessaggio({ tipo: 'error', testo: 'Errore nell\'eliminare la spesa' });
        }
    };

    const totaleSpese = spese.reduce((sum, spesa) => sum + spesa.importo, 0);

    if (dataLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Caricamento spese...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Uscite - {getNomeeMese(meseSelezionato)} {annoSelezionato}
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Totale uscite</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(totaleSpese)}</p>
                </div>
            </div>

            {/* Form per nuova spesa */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Aggiungi nuova spesa</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="importo-spesa" className="block text-sm font-medium text-gray-700 mb-1">
                            Importo *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                id="importo-spesa"
                                step="0.01"
                                min="0"
                                value={nuovaSpesa.importo}
                                onChange={(e) => setNuovaSpesa({ ...nuovaSpesa, importo: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="0.00"
                                required
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="categoria-spesa" className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                        </label>
                        <select
                            id="categoria-spesa"
                            value={nuovaSpesa.categoria}
                            onChange={(e) => setNuovaSpesa({ ...nuovaSpesa, categoria: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">Seleziona categoria</option>
                            {categorieComuni.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="descrizione-spesa" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrizione
                    </label>
                    <input
                        type="text"
                        id="descrizione-spesa"
                        value={nuovaSpesa.descrizione}
                        onChange={(e) => setNuovaSpesa({ ...nuovaSpesa, descrizione: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Descrizione della spesa..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !nuovaSpesa.importo}
                    className="w-full flex items-center justify-center space-x-2 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Aggiungendo...' : 'Aggiungi Spesa'}</span>
                </button>
            </form>

            {/* Lista uscite */}
            <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Uscite del mese ({spese.length})</h4>

                {spese.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nessuna uscita registrata per questo mese</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {spese.map((spesa) => (
                            <div key={spesa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-orange-600">
                                            {formatCurrency(spesa.importo)}
                                        </span>
                                        {spesa.categoria && (
                                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                                {spesa.categoria}
                                            </span>
                                        )}
                                    </div>
                                    {spesa.descrizione && (
                                        <p className="text-sm text-gray-600 mt-1">{spesa.descrizione}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(spesa.data_inserimento).toLocaleDateString('it-IT')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleEliminaSpesa(spesa.id)}
                                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Elimina spesa"
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

export default GestioneSpese;
