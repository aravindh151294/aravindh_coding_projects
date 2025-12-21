'use client';

import { useState, useCallback } from 'react';
import { DEFAULT_CURRENCY } from '@/lib/constants';
import { eurToInr, formatEUR, formatINR } from '@/lib/formatters';

export function useCurrency() {
    const [exchangeRate, setExchangeRate] = useState(DEFAULT_CURRENCY.eurToInr);

    const convertToINR = useCallback((eur: number) => {
        return eurToInr(eur, exchangeRate);
    }, [exchangeRate]);

    const formatBothCurrencies = useCallback((eur: number) => {
        return {
            eur: formatEUR(eur),
            inr: formatINR(eurToInr(eur, exchangeRate)),
        };
    }, [exchangeRate]);

    return {
        exchangeRate,
        setExchangeRate,
        convertToINR,
        formatBothCurrencies,
        formatEUR,
        formatINR,
    };
}
