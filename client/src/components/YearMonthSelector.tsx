import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

interface YearMonthSelectorProps {
    annoSelezionato: number;
    meseSelezionato: number;
    onAnnoChange: (anno: number) => void;
    onMeseChange: (mese: number) => void;
    anniDisponibili: number[];
}

const YearMonthSelector: React.FC<YearMonthSelectorProps> = ({
    annoSelezionato,
    meseSelezionato,
    onAnnoChange,
    onMeseChange,
    anniDisponibili
}) => {
    const [dropdownAnnoAperto, setDropdownAnnoAperto] = useState(false);
    const [dropdownMeseAperto, setDropdownMeseAperto] = useState(false);

    const nomiMesi = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const cambiaData = (direzione: 'prev' | 'next') => {
        if (direzione === 'prev') {
            if (meseSelezionato === 1) {
                onMeseChange(12);
                onAnnoChange(annoSelezionato - 1);
            } else {
                onMeseChange(meseSelezionato - 1);
            }
        } else {
            if (meseSelezionato === 12) {
                onMeseChange(1);
                onAnnoChange(annoSelezionato + 1);
            } else {
                onMeseChange(meseSelezionato + 1);
            }
        }
    };

    const anniConFuturo = () => {
        const annoCorrente = new Date().getFullYear();
        const anniConDati = [...anniDisponibili];

        // Aggiungi anno corrente se non c'è
        if (!anniConDati.includes(annoCorrente)) {
            anniConDati.push(annoCorrente);
        }

        // Aggiungi anno successivo se non c'è
        const annoSuccessivo = annoCorrente + 1;
        if (!anniConDati.includes(annoSuccessivo)) {
            anniConDati.push(annoSuccessivo);
        }

        return anniConDati.sort((a, b) => b - a); // Ordine decrescente
    };

    return (
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {/* Freccia precedente */}
            <button
                onClick={() => cambiaData('prev')}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="Mese precedente"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Selettore Anno */}
            <div className="relative">
                <button
                    onClick={() => setDropdownAnnoAperto(!dropdownAnnoAperto)}
                    className="flex items-center space-x-1 px-3 py-2 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors min-w-[80px]"
                >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{annoSelezionato}</span>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                {dropdownAnnoAperto && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Anni disponibili</div>
                            {anniConFuturo().map((anno) => (
                                <button
                                    key={anno}
                                    onClick={() => {
                                        onAnnoChange(anno);
                                        setDropdownAnnoAperto(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${anno === annoSelezionato ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    {anno}
                                    {anno > new Date().getFullYear() && (
                                        <span className="text-xs text-gray-400 ml-2">(futuro)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Separatore */}
            <div className="text-gray-400">-</div>

            {/* Selettore Mese */}
            <div className="relative">
                <button
                    onClick={() => setDropdownMeseAperto(!dropdownMeseAperto)}
                    className="flex items-center space-x-1 px-3 py-2 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors min-w-[120px]"
                >
                    <span className="font-medium text-gray-900">
                        {nomiMesi[meseSelezionato - 1]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                {dropdownMeseAperto && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="p-2">
                            {nomiMesi.map((mese, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onMeseChange(index + 1);
                                        setDropdownMeseAperto(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 ${(index + 1) === meseSelezionato ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    {mese}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Freccia successiva */}
            <button
                onClick={() => cambiaData('next')}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="Mese successivo"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};

export default YearMonthSelector;