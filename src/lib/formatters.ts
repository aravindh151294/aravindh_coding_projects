// Static formatting utilities for FinDash (non-React contexts like chart callbacks)
// For React components, use the useFormatters hook instead

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
