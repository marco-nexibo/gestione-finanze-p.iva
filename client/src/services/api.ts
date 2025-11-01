import axios from 'axios';
import { DatiMensili, RiepilogoAnnuale, ProfiloFiscale } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor per aggiungere automaticamente il token di autorizzazione
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor per gestire errori di autenticazione
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token scaduto o non valido, rimuovi i dati di autenticazione
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Non ricaricare automaticamente la pagina, lascia che sia l'AuthContext a gestirlo
        }
        return Promise.reject(error);
    }
);

export const apiService = {
    // Ottieni dati mensili
    getDatiMensili: async (anno: number, mese: number): Promise<DatiMensili> => {
        const response = await api.get(`/api/mese/${anno}/${mese}`);
        return response.data;
    },

    // Salva entrate mensili
    salvaEntrate: async (mese: number, anno: number, importo: number, descrizione?: string) => {
        const response = await api.post('/api/entrate', {
            mese,
            anno,
            importo,
            descrizione
        });
        return response.data;
    },

    // Modifica entrata esistente
    modificaEntrata: async (id: number, importo: number, descrizione?: string) => {
        const response = await api.put(`/api/entrate/${id}`, {
            importo,
            descrizione
        });
        return response.data;
    },

    // Aggiungi spesa
    aggiungiSpesa: async (mese: number, anno: number, importo: number, categoria?: string, descrizione?: string) => {
        const response = await api.post('/api/spese', {
            mese,
            anno,
            importo,
            categoria,
            descrizione
        });
        return response.data;
    },

    // Aggiungi prelievo
    aggiungiPrelievo: async (mese: number, anno: number, importo: number, descrizione?: string) => {
        const response = await api.post('/api/prelievi', {
            mese,
            anno,
            importo,
            descrizione
        });
        return response.data;
    },

    // Elimina spesa
    eliminaSpesa: async (id: number) => {
        const response = await api.delete(`/api/spese/${id}`);
        return response.data;
    },

    // Elimina prelievo
    eliminaPrelievo: async (id: number) => {
        const response = await api.delete(`/api/prelievi/${id}`);
        return response.data;
    },

    // Elimina singola entrata
    eliminaEntrata: async (id: number) => {
        const response = await api.delete(`/api/entrate/${id}`);
        return response.data;
    },

    // Ottieni riepilogo annuale
    getRiepilogoAnnuale: async (anno: number): Promise<RiepilogoAnnuale> => {
        const response = await api.get(`/api/riepilogo/${anno}`);
        return response.data;
    },

    // Ottieni anni disponibili
    getAnniDisponibili: async (): Promise<number[]> => {
        const response = await api.get(`/api/anni-disponibili`);
        return response.data.anni;
    },

    // Profilo fiscale
    getProfiloFiscale: async (): Promise<ProfiloFiscale> => {
        const response = await api.get('/api/profilo-fiscale');
        return {
            aliquotaIrpef: response.data.aliquota_irpef,
            coefficienteRedditivita: response.data.coefficiente_redditivita,
            gestioneInps: response.data.gestione_inps === 'separata' ? 'gestione_separata' : 'artigiani_commercianti'
        };
    },

    salvaProfiloFiscale: async (profilo: ProfiloFiscale) => {
        const response = await api.post('/api/profilo-fiscale', {
            aliquotaIrpef: profilo.aliquotaIrpef,
            coefficienteRedditivita: profilo.coefficienteRedditivita,
            gestioneInps: profilo.gestioneInps
        });
        return response.data;
    },
};
