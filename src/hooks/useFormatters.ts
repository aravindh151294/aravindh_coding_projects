'use client';

import { useMemo, useCallback } from 'react';
import { useAppState } from '@/context/AppContext';

export type LocaleType = 'en-US' | 'de-DE' | 'browser';

// Get the actual locale string based on preference
function getLocale(preference: LocaleType): string {
    if (preference === 'browser') {
        return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    }
    return preference;
}

/**
 * Hook that provides locale-aware formatting functions
 * These functions will re-render when locale changes in context
 */
export function useFormatters() {
    const { currency } = useAppState();
    const locale = currency.locale;
    const loc = getLocale(locale);

    const formatEUR = useCallback((amount: number): string => {
        return new Intl.NumberFormat(loc, {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }, [loc]);

    const formatINR = useCallback((amount: number): string => {
        const formatted = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        // If German locale, replace period with comma for decimals
        if (locale === 'de-DE') {
            return formatted.replace(/\.(\d{2})$/, ',$1');
        }
        return formatted;
    }, [locale]);

    const formatNumber = useCallback((num: number, decimals: number = 2): string => {
        return new Intl.NumberFormat(loc, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(num);
    }, [loc]);

    const formatPercent = useCallback((value: number, decimals: number = 2): string => {
        const formatted = new Intl.NumberFormat(loc, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
        return `${formatted}%`;
    }, [loc]);

    const abbreviateNumber = useCallback((num: number): string => {
        const decimalSep = locale === 'de-DE' ? ',' : '.';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.', decimalSep)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.', decimalSep)}K`;
        return num.toFixed(2).replace('.', decimalSep);
    }, [locale]);

    const getInputLang = useCallback((): string => {
        if (locale === 'browser') return '';
        return locale === 'de-DE' ? 'de' : 'en';
    }, [locale]);

    return useMemo(() => ({
        formatEUR,
        formatINR,
        formatNumber,
        formatPercent,
        abbreviateNumber,
        getInputLang,
        locale,
    }), [formatEUR, formatINR, formatNumber, formatPercent, abbreviateNumber, getInputLang, locale]);
}

// Static format functions for use outside React components (charts, etc.)
// These require locale to be passed explicitly
export function formatEURStatic(amount: number, locale: LocaleType = 'en-US'): string {
    const loc = getLocale(locale);
    return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatNumberStatic(num: number, decimals: number = 2, locale: LocaleType = 'en-US'): string {
    const loc = getLocale(locale);
    return new Intl.NumberFormat(loc, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format months to years and months display (locale-independent)
 */
export function formatDuration(months: number): string {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Convert EUR to INR
 */
export function eurToInr(eur: number, rate: number = 89): number {
    return Math.round(eur * rate * 100) / 100;
}

/**
 * Parse a numeric input value, stripping leading zeros
 */
export function parseNumericInput(value: string): number {
    // Remove leading zeros except for decimals like "0.5"
    const cleaned = value.replace(/^0+(?=\d)/, '');
    const parsed = parseFloat(cleaned || '0');
    return isNaN(parsed) ? 0 : parsed;
}
