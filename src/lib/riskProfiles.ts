// Risk profiles and default rates for investment instruments
// All rates are annual percentages

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'medium_high' | 'high' | 'very_high';
export type InvestmentMode = 'lumpsum' | 'sip';

export interface InstrumentProfile {
    id: string;
    name: string;
    defaultRate: number;
    riskLevel: RiskLevel;
    returnGuarantee: number; // 0-100%
    description: string;
    requiresCountry?: boolean;
    supportedModes: InvestmentMode[];
    defaultTaxRate: number; // 0-100%
}

export const RISK_COLORS: Record<RiskLevel, string> = {
    'very_low': '#10b981',   // Green
    'low': '#22c55e',        // Light green
    'medium': '#f59e0b',     // Amber
    'medium_high': '#f97316', // Orange
    'high': '#ef4444',       // Red
    'very_high': '#dc2626',  // Dark red
};

export const RISK_LABELS: Record<RiskLevel, string> = {
    'very_low': 'Very Low',
    'low': 'Low',
    'medium': 'Medium',
    'medium_high': 'Medium-High',
    'high': 'High',
    'very_high': 'Very High',
};

export const INVESTMENT_INSTRUMENTS: InstrumentProfile[] = [
    {
        id: 'fd',
        name: 'Fixed Deposit',
        defaultRate: 7.0,
        riskLevel: 'very_low',
        returnGuarantee: 98,
        description: 'Bank fixed deposits with guaranteed returns',
        supportedModes: ['lumpsum'],
        defaultTaxRate: 30,
    },
    {
        id: 'rd',
        name: 'Recurring Deposit',
        defaultRate: 6.5,
        riskLevel: 'very_low',
        returnGuarantee: 98,
        description: 'Monthly deposits with guaranteed returns',
        supportedModes: ['sip'],
        defaultTaxRate: 30,
    },
    {
        id: 'govt_bonds',
        name: 'Government Bonds',
        defaultRate: 6.5,
        riskLevel: 'low',
        returnGuarantee: 95,
        description: 'Sovereign bonds backed by government',
        supportedModes: ['lumpsum'],
        defaultTaxRate: 20,
    },
    {
        id: 'corp_bonds',
        name: 'Corporate Bonds',
        defaultRate: 8.0,
        riskLevel: 'medium',
        returnGuarantee: 70,
        description: 'Bonds issued by corporations',
        supportedModes: ['lumpsum'],
        defaultTaxRate: 30,
    },
    {
        id: 'gold',
        name: 'Gold',
        defaultRate: 8.0,
        riskLevel: 'medium',
        returnGuarantee: 60,
        description: 'Physical gold or gold ETFs',
        supportedModes: ['lumpsum', 'sip'],
        defaultTaxRate: 20,
    },
    {
        id: 'mutual_funds',
        name: 'Mutual Funds / ETF',
        defaultRate: 12.0,
        riskLevel: 'medium_high',
        returnGuarantee: 50,
        description: 'Diversified fund investments',
        requiresCountry: true,
        supportedModes: ['lumpsum', 'sip'],
        defaultTaxRate: 15,
    },
    {
        id: 'equity',
        name: 'Direct Equity',
        defaultRate: 15.0,
        riskLevel: 'high',
        returnGuarantee: 30,
        description: 'Individual stock investments',
        requiresCountry: true,
        supportedModes: ['lumpsum'],
        defaultTaxRate: 15,
    },
];

export const COUNTRY_OPTIONS = [
    { value: 'india', label: 'India' },
    { value: 'us', label: 'United States' },
    { value: 'eu', label: 'European Union' },
    { value: 'other', label: 'Other' },
];

export function getInstrumentById(id: string): InstrumentProfile | undefined {
    return INVESTMENT_INSTRUMENTS.find(i => i.id === id);
}

export function getInstrumentsByMode(mode: InvestmentMode): InstrumentProfile[] {
    return INVESTMENT_INSTRUMENTS.filter(i => i.supportedModes.includes(mode));
}

export function getRiskColor(level: RiskLevel): string {
    return RISK_COLORS[level];
}

export function getRiskLabel(level: RiskLevel): string {
    return RISK_LABELS[level];
}
