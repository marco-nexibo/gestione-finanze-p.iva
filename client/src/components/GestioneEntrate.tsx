import React, { useState, useEffect } from 'react';
import { Entrata } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, getNomeeMese } from '../utils/formatters';
import { DollarSign, Save, AlertCircle, Edit, Trash2, Plus } from 'lucide-react';

interface GestioneEntrateProps {
  meseSelezionato: number;
  annoSelezionato: number;
  entrate: Entrata[];
  percentualeTasse: number;
  onEntrateAggiornate: () => void;
}

const GestioneEntrate: React.FC<GestioneEntrateProps> = ({
  meseSelezionato,
  annoSelezionato,
  entrate: propEntrate,
  percentualeTasse,
  onEntrateAggiornate
}) => {
  const [importo, setImporto] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [loading, setLoading] = useState(false);
  const [messaggio, setMessaggio] = useState<{ tipo: 'success' | 'error'; testo: string } | null>(null);
  const [entrataInModifica, setEntrataInModifica] = useState<Entrata | null>(null);
  const [entrate, setEntrate] = useState<Entrata[]>(propEntrate);
  const [dataLoading, setDataLoading] = useState(false);

  // Aggiorna le entrate quando cambiano le props
  useEffect(() => {
    setEntrate(propEntrate);
  }, [propEntrate]);

  // Carica i dati quando cambiano mese/anno (se non vengono passati dalle props)
  useEffect(() => {
    if (propEntrate.length === 0) {
      caricaDati();
    }
  }, [meseSelezionato, annoSelezionato]);

  const caricaDati = async () => {
    try {
      setDataLoading(true);
      const datiMensili = await apiService.getDatiMensili(annoSelezionato, meseSelezionato);
      setEntrate(datiMensili.entrate.lista);
    } catch (error) {
      console.error('Errore nel caricamento delle entrate:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!importo || parseFloat(importo) < 0) {
      setMessaggio({ tipo: 'error', testo: 'Inserisci un importo valido' });
      return;
    }

    try {
      setLoading(true);
      setMessaggio(null);

      if (entrataInModifica) {
        // Modalità modifica
        await apiService.modificaEntrata(
          entrataInModifica.id,
          parseFloat(importo),
          descrizione
        );
        setMessaggio({ tipo: 'success', testo: 'Entrata modificata correttamente!' });
      } else {
        // Modalità inserimento
        await apiService.salvaEntrate(
          meseSelezionato,
          annoSelezionato,
          parseFloat(importo),
          descrizione
        );
        setMessaggio({ tipo: 'success', testo: 'Entrata aggiunta correttamente!' });
      }

      // Reset form
      setImporto('');
      setDescrizione('');
      setEntrataInModifica(null);
      onEntrateAggiornate();

      setTimeout(() => setMessaggio(null), 3000);
    } catch (error) {
      console.error('Errore nel salvare l\'entrata:', error);
      setMessaggio({ tipo: 'error', testo: 'Errore nel salvare l\'entrata' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminaEntrata = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa entrata?')) {
      return;
    }

    try {
      await apiService.eliminaEntrata(id);
      setMessaggio({ tipo: 'success', testo: 'Entrata eliminata correttamente!' });
      onEntrateAggiornate();

      setTimeout(() => setMessaggio(null), 3000);
    } catch (error) {
      console.error('Errore nell\'eliminare l\'entrata:', error);
      setMessaggio({ tipo: 'error', testo: 'Errore nell\'eliminare l\'entrata' });
    }
  };

  const handleModificaEntrata = (entrata: Entrata) => {
    setImporto(entrata.importo.toString());
    setDescrizione(entrata.descrizione || '');
    setEntrataInModifica(entrata);
    // Focus sul campo importo
    setTimeout(() => {
      const importoField = document.getElementById('importo-entrate');
      if (importoField) importoField.focus();
    }, 100);
  };

  const handleAnnullaModifica = () => {
    setImporto('');
    setDescrizione('');
    setEntrataInModifica(null);
  };

  const calcolaTasse = (entrate: number) => {
    return (entrate * percentualeTasse) / 100;
  };

  const importoNumerico = parseFloat(importo) || 0;
  const tassePreviste = calcolaTasse(importoNumerico);
  const nettoDopoTasse = importoNumerico - tassePreviste;
  const totaleEntrate = entrate.reduce((sum, entrata) => sum + entrata.importo, 0);

  if (dataLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento entrate...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Entrate - {getNomeeMese(meseSelezionato)} {annoSelezionato}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Totale entrate</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totaleEntrate)}</p>
        </div>
      </div>

      {/* Form per inserimento/modifica entrate */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            {entrataInModifica ? (
              <>
                <Edit className="h-4 w-4" />
                <span>Modifica entrata</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Aggiungi nuova entrata</span>
              </>
            )}
          </h4>
          {entrataInModifica && (
            <button
              type="button"
              onClick={handleAnnullaModifica}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Annulla modifica
            </button>
          )}
        </div>

        <div>
          <label htmlFor="importo-entrate" className="block text-sm font-medium text-gray-700 mb-1">
            Importo *
          </label>
          <div className="relative">
            <input
              type="number"
              id="importo-entrate"
              step="0.01"
              min="0"
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
          </div>
        </div>

        <div>
          <label htmlFor="descrizione-entrate" className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione
          </label>
          <textarea
            id="descrizione-entrate"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Descrizione delle entrate del mese..."
          />
        </div>

        {/* Anteprima calcoli */}
        {importoNumerico > 0 && (
          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-800">Anteprima calcoli:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Entrate lorde:</span>
                <span className="font-medium text-green-600">{formatCurrency(importoNumerico)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tasse e Contributi ({percentualeTasse}%):</span>
                <span className="font-medium text-red-600">-{formatCurrency(tassePreviste)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-medium text-gray-800">Netto dopo tasse:</span>
                <span className="font-bold text-blue-600">{formatCurrency(nettoDopoTasse)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !importo}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>
            {loading ? 'Salvataggio...' : entrataInModifica ? 'Modifica Entrata' : 'Aggiungi Entrata'}
          </span>
        </button>
      </form>

      {/* Lista entrate esistenti */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Entrate del mese ({entrate.length})</h4>

        {entrate.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nessuna entrata registrata per questo mese</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entrate.map((entrata) => (
              <div key={entrata.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(entrata.importo)}
                    </span>
                  </div>
                  {entrata.descrizione && (
                    <p className="text-sm text-gray-600 mt-1">{entrata.descrizione}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entrata.data_inserimento).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleModificaEntrata(entrata)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Modifica entrata"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEliminaEntrata(entrata.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Elimina entrata"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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

export default GestioneEntrate;