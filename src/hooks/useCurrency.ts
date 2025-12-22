'use client';

import { useCallback } from 'react';
import { eurToInr } from '@/lib/formatters';
import { useFormatters } from '@/hooks/useFormatters';
import { useAppState } from '@/context/AppContext';

export function useCurrency() {
    const { currency } = useAppState();
    const exchangeRate = currency.eurToInr;
    const { formatEUR, formatINR } = useFormatters();

    const convertToINR = useCallback((eur: number) => {
        return eurToInr(eur, exchangeRate);
    }, [exchangeRate]);

    const formatBothCurrencies = useCallback((eur: number) => {
        return {
            eur: formatEUR(eur),
            inr: formatINR(eurToInr(eur, exchangeRate)),
        };
    }, [exchangeRate, formatEUR, formatINR]);

    return {
        exchangeRate,
        convertToINR,
        formatBothCurrencies,
        formatEUR,
        formatINR,
    };
}
