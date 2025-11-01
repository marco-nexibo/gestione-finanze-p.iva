export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
};

export const getNomeeMese = (mese: number): string => {
    const mesi = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return mesi[mese - 1] || '';
};

export const getMeseCorrente = (): { mese: number; anno: number } => {
    const now = new Date();
    return {
        mese: now.getMonth() + 1,
        anno: now.getFullYear()
    };
};
