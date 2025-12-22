// Formatting utilities for FinDash
// Supports multiple locales: en-US (period decimal), de-DE (comma decimal), browser default

export type LocaleType = 'en-US' | 'de-DE' | 'browser';

// Get the actual locale string based on preference
function getLocale(preference: LocaleType): string {
    if (preference === 'browser') {
        return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    }
    return preference;
}

// Global locale state (will be set by context)
let currentLocale: LocaleType = 'en-US';

export function setGlobalLocale(locale: LocaleType) {
    currentLocale = locale;
}

export function getGlobalLocale(): LocaleType {
    return currentLocale;
}

/**
 * Format number as currency (EUR)
 */
export function formatEUR(amount: number, locale?: LocaleType): string {
    const loc = getLocale(locale || currentLocale);
    return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format number as currency (INR)
 */
export function formatINR(amount: number, locale?: LocaleType): string {
    // Use en-IN for lakh/crore grouping
    const loc = locale || currentLocale;
    // For INR, always use Indian grouping but respect decimal separator
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    // If German locale, replace period with comma for decimals
    if (loc === 'de-DE') {
        return formatted.replace(/\.(\d{2})$/, ',$1');
    }
    return formatted;
}

/**
 * Convert EUR to INR
 */
export function eurToInr(eur: number, rate: number = 89): number {
    return Math.round(eur * rate * 100) / 100;
}

/**
 * Format number with thousand separators and appropriate decimal
 */
export function formatNumber(num: number, decimals: number = 2, locale?: LocaleType): string {
    const loc = getLocale(locale || currentLocale);
    return new Intl.NumberFormat(loc, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format months to years and months display
 */
export function formatDuration(months: number): string {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2, locale?: LocaleType): string {
    const loc = getLocale(locale || currentLocale);
    const formatted = new Intl.NumberFormat(loc, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
    return `${formatted}%`;
}

/**
 * Abbreviate large numbers (e.g., 1.5M, 2.3K)
 */
export function abbreviateNumber(num: number, locale?: LocaleType): string {
    const loc = getLocale(locale || currentLocale);
    const decimalSep = loc === 'de-DE' ? ',' : '.';

    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.', decimalSep)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.', decimalSep)}K`;
    return num.toFixed(2).replace('.', decimalSep);
}

/**
 * Get the input lang attribute for forcing decimal format
 */
export function getInputLang(locale?: LocaleType): string {
    const loc = locale || currentLocale;
    if (loc === 'browser') return '';
    return loc === 'de-DE' ? 'de' : 'en';
}
