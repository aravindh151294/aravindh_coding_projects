// Formatting utilities for FinDash
// All numbers use period (.) as decimal separator

/**
 * Format number as currency (EUR) with period decimal separator
 */
export function formatEUR(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format number as currency (INR) with period decimal separator
 */
export function formatINR(amount: number): string {
    // Use en-IN for lakh/crore grouping but force period decimal
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    // en-IN already uses period for decimals, so no change needed
    return formatted;
}

/**
 * Convert EUR to INR
 */
export function eurToInr(eur: number, rate: number = 89): number {
    return Math.round(eur * rate * 100) / 100;
}

/**
 * Format number with thousand separators (comma) and period decimal
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
 * Format percentage with period decimal separator
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
