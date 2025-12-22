// Risk profiles and default rates for investment instruments
// All rates are annual percentages

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'medium_high' | 'high' | 'very_high';

export interface InstrumentProfile {
    id: string;
    name: string;
    defaultRate: number;
    riskLevel: RiskLevel;
    returnGuarantee: number; // 0-100%
    description: string;
    requiresCountry?: boolean;
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
    },
    {
        id: 'govt_bonds',
        name: 'Government Bonds',
        defaultRate: 6.5,
        riskLevel: 'low',
        returnGuarantee: 95,
        description: 'Sovereign bonds backed by government',
    },
    {
        id: 'corp_bonds',
        name: 'Corporate Bonds',
        defaultRate: 8.0,
        riskLevel: 'medium',
        returnGuarantee: 70,
        description: 'Bonds issued by corporations',
    },
    {
        id: 'gold',
        name: 'Gold',
        defaultRate: 8.0,
        riskLevel: 'medium',
        returnGuarantee: 60,
        description: 'Physical gold or gold ETFs',
    },
    {
        id: 'mutual_funds',
        name: 'Mutual Funds / ETF',
        defaultRate: 12.0,
        riskLevel: 'medium_high',
        returnGuarantee: 50,
        description: 'Diversified fund investments',
        requiresCountry: true,
    },
    {
        id: 'equity',
        name: 'Direct Equity',
        defaultRate: 15.0,
        riskLevel: 'high',
        returnGuarantee: 30,
        description: 'Individual stock investments',
        requiresCountry: true,
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

export function getRiskColor(level: RiskLevel): string {
    return RISK_COLORS[level];
}

export function getRiskLabel(level: RiskLevel): string {
    return RISK_LABELS[level];
}
