import React, { useState, useEffect } from 'react';
import { RiepilogoAnnuale as RiepilogoAnnualeType } from '../types';
import { apiService } from '../services/api';
import { formatCurrency, getNomeeMese } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, DollarSign, TrendingDown, Wallet } from 'lucide-react';

interface RiepilogoAnnualeProps {
    annoSelezionato: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const RiepilogoAnnuale: React.FC<RiepilogoAnnualeProps> = ({ annoSelezionato }) => {
    const [dati, setDati] = useState<RiepilogoAnnualeType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        caricaDati();
    }, [annoSelezionato]);

    const caricaDati = async () => {
        try {
            setLoading(true);
            setError(null);
            const riepilogo = await apiService.getRiepilogoAnnuale(annoSelezionato);
            setDati(riepilogo);
        } catch (err) {
            setError('Errore nel caricamento del riepilogo annuale');
            console.error('Errore caricamento riepilogo:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
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

    // Prepara i dati per i grafici
    const datiGrafico = dati.riepilogo.map(mese => ({
        nome: getNomeeMese(mese.mese).substring(0, 3),
        entrate: mese.entrate,
        spese: mese.spese,
        prelievi: mese.prelievi,
        tasse: mese.tasse,
        stipendioDisponibile: mese.stipendioDisponibile
    }));

    const datiTorta = [
        { name: 'Entrate', value: dati.totali.entrate, color: COLORS[0] },
        { name: 'Tasse e Contributi', value: dati.totali.tasse, color: COLORS[2] },
        { name: 'Uscite', value: dati.totali.spese, color: COLORS[1] },
        { name: 'Prelievi', value: dati.totali.prelievi, color: COLORS[3] }
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-6">
                <div className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8" />
                    <div>
                        <h2 className="text-2xl font-bold">Riepilogo Annuale {annoSelezionato}</h2>
                        <p className="text-purple-100">Panoramica completa dell'anno</p>
                    </div>
                </div>
            </div>

            {/* Cards riassuntive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        <div>
                            <p className="text-sm text-gray-600">Entrate Totali</p>
                            <p className="text-lg font-bold text-green-600">
                                {formatCurrency(dati.totali.entrate)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="h-6 w-6 text-red-500" />
                        <div>
                            <p className="text-sm text-gray-600">Tasse e Contributi</p>
                            <p className="text-lg font-bold text-red-600">
                                {formatCurrency(dati.totali.tasse)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                    <div className="flex items-center space-x-3">
                        <TrendingDown className="h-6 w-6 text-orange-500" />
                        <div>
                            <p className="text-sm text-gray-600">Uscite</p>
                            <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(dati.totali.spese)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-3">
                        <Wallet className="h-6 w-6 text-blue-500" />
                        <div>
                            <p className="text-sm text-gray-600">Prelievi</p>
                            <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(dati.totali.prelievi)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <div className="flex items-center space-x-3">
                        <Wallet className="h-6 w-6 text-purple-500" />
                        <div>
                            <p className="text-sm text-gray-600">Disponibile</p>
                            <p className={`text-lg font-bold ${dati.totali.stipendioDisponibile >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                {formatCurrency(dati.totali.stipendioDisponibile)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grafici */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grafico a barre mensile */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Andamento Mensile</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datiGrafico}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nome" />
                            <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), '']}
                                labelFormatter={(label) => `Mese: ${label}`}
                            />
                            <Bar dataKey="entrate" name="Entrate" fill="#10B981" />
                            <Bar dataKey="spese" name="Uscite" fill="#F59E0B" />
                            <Bar dataKey="prelievi" name="Prelievi" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Grafico a torta */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Annuale</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={datiTorta}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {datiTorta.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabella dettagliata */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettaglio Mensile</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mese
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entrate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tasse e Contributi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Uscite
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prelievi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Disponibile
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dati.riepilogo.map((mese) => (
                                <tr key={mese.mese} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {getNomeeMese(mese.mese)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                        {formatCurrency(mese.entrate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                        {formatCurrency(mese.tasse)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                        {formatCurrency(mese.spese)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                        {formatCurrency(mese.prelievi)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${mese.stipendioDisponibile >= 0 ? 'text-purple-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(mese.stipendioDisponibile)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RiepilogoAnnuale;
