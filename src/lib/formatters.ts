// Formatting utilities for FinDash

/**
 * Format number as currency (EUR)
 */
export function formatEUR(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format number as currency (INR)
 */
export function formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Convert EUR to INR
 */
export function eurToInr(eur: number, rate: number = 89): number {
    return Math.round(eur * rate * 100) / 100;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
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
export function formatPercent(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Abbreviate large numbers (e.g., 1.5M, 2.3K)
 */
export function abbreviateNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
}
