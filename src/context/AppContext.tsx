'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_LOAN, DEFAULT_CURRENCY } from '@/lib/constants';
import { INVESTMENT_INSTRUMENTS, getInstrumentsByMode, InvestmentMode } from '@/lib/riskProfiles';

// Loan State
export interface LoanState {
    principal: number;
    annualRate: number;
    termMonths: number;
    prepaymentAmount: number;
    prepaymentMonth: number;
    penaltyRate: number;
    extraMonthlyPayment: number;
    extraPaymentTiming: 'before' | 'after' | 'both';
}

// Investment Allocation (with per-instrument tax rate and expense ratio)
export interface InvestmentAllocation {
    instrumentId: string;
    instanceLabel: string; // e.g., "FD #1", "MF #2"
    amount: number;
    percentage: number;
    annualRate: number;
    taxRate: number;
    expenseRatio: number; // For MF/ETF, 0 for others
    country?: string;
}

// Lumpsum Investment State
export interface LumpsumState {
    totalAmount: number;
    linkedToLoan: boolean;
    inputMode: 'percentage' | 'amount';
    allocations: InvestmentAllocation[];
}

// SIP Investment State
export interface SIPState {
    monthlyAmount: number;
    inputMode: 'percentage' | 'amount';
    allocations: InvestmentAllocation[];
}

// Combined Investment State
export interface InvestmentState {
    termMonths: number;
    compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    adjustInflation: boolean;
    inflationRate: number;
    activeTab: 'lumpsum' | 'sip';
    lumpsum: LumpsumState;
    sip: SIPState;
    comparisonMode: ComparisonMode;
}

// Locale type for number formatting
export type LocalePreference = 'en-US' | 'de-DE' | 'browser';

// Comparison Mode
export type ComparisonMode = 'loan_lumpsum_sip' | 'lumpsum_sip' | 'lumpsum_only' | 'sip_only';

// Currency State (Centralized)
export interface CurrencyState {
    eurToInr: number;
    locale: LocalePreference;
}

// Combined App State
interface AppState {
    loan: LoanState;
    investment: InvestmentState;
    currency: CurrencyState;
    setLoan: (loan: Partial<LoanState>) => void;
    setInvestment: (investment: Partial<InvestmentState>) => void;
    setLumpsum: (lumpsum: Partial<LumpsumState>) => void;
    setSIP: (sip: Partial<SIPState>) => void;
    setComparisonMode: (mode: ComparisonMode) => void;
    setCurrency: (currency: Partial<CurrencyState>) => void;
    updateAllocation: (mode: InvestmentMode, index: number, updates: Partial<InvestmentAllocation>) => void;
    addAllocation: (mode: InvestmentMode, instrumentId: string) => void;
    removeAllocation: (mode: InvestmentMode, index: number) => void;
    recalculateAllocations: (mode: InvestmentMode, inputMode: 'percentage' | 'amount', newTotal?: number) => void;
    resetAll: () => void;
}

// Helper to create default allocation with instance number
function createDefaultAllocation(instrumentId: string, instanceNum: number = 1): InvestmentAllocation {
    const instrument = INVESTMENT_INSTRUMENTS.find(i => i.id === instrumentId);
    const hasExpenseRatio = instrumentId === 'mutual_funds' || instrumentId === 'gold';
    return {
        instrumentId,
        instanceLabel: `${instrument?.name || instrumentId} #${instanceNum}`,
        amount: 0,
        percentage: 100,
        annualRate: instrument?.defaultRate ?? 7,
        taxRate: instrument?.defaultTaxRate ?? 30,
        expenseRatio: hasExpenseRatio ? 0.5 : 0, // Default 0.5% for MF/ETF, 0 for others
    };
}

const defaultLoanState: LoanState = {
    principal: DEFAULT_LOAN.principal,
    annualRate: DEFAULT_LOAN.annualRate,
    termMonths: DEFAULT_LOAN.termMonths,
    prepaymentAmount: DEFAULT_LOAN.prepaymentAmount,
    prepaymentMonth: DEFAULT_LOAN.prepaymentMonth,
    penaltyRate: DEFAULT_LOAN.penaltyRate,
    extraMonthlyPayment: DEFAULT_LOAN.extraMonthlyPayment,
    extraPaymentTiming: 'both',
};

const lumpsumInstruments = getInstrumentsByMode('lumpsum');
const sipInstruments = getInstrumentsByMode('sip');

const defaultInvestmentState: InvestmentState = {
    termMonths: DEFAULT_LOAN.termMonths,
    compoundingFrequency: 'quarterly',
    adjustInflation: false,
    inflationRate: 6,
    activeTab: 'lumpsum',
    lumpsum: {
        totalAmount: DEFAULT_LOAN.principal,
        linkedToLoan: true, // Default to true for loan_lumpsum_sip mode
        inputMode: 'percentage',
        allocations: [{ ...createDefaultAllocation(lumpsumInstruments[0]?.id || 'fd'), annualRate: DEFAULT_LOAN.annualRate }],
    },
    sip: {
        monthlyAmount: Math.round(DEFAULT_LOAN.principal / DEFAULT_LOAN.termMonths),
        inputMode: 'percentage',
        allocations: [{ ...createDefaultAllocation(sipInstruments[0]?.id || 'rd'), annualRate: DEFAULT_LOAN.annualRate }],
    },
    comparisonMode: 'loan_lumpsum_sip',
};

const defaultCurrencyState: CurrencyState = {
    eurToInr: DEFAULT_CURRENCY.eurToInr,
    locale: 'en-US',
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [loan, setLoanState] = useState<LoanState>(defaultLoanState);
    const [investment, setInvestmentState] = useState<InvestmentState>(defaultInvestmentState);
    const [currency, setCurrencyState] = useState<CurrencyState>(defaultCurrencyState);

    const setLoan = (updates: Partial<LoanState>) => {
        setLoanState(prev => ({ ...prev, ...updates }));
    };

    const setInvestment = (updates: Partial<InvestmentState>) => {
        setInvestmentState(prev => ({ ...prev, ...updates }));
    };

    const setLumpsum = (updates: Partial<LumpsumState>) => {
        setInvestmentState(prev => ({
            ...prev,
            lumpsum: { ...prev.lumpsum, ...updates },
        }));
    };

    const setSIP = (updates: Partial<SIPState>) => {
        setInvestmentState(prev => ({
            ...prev,
            sip: { ...prev.sip, ...updates },
        }));
    };

    const setCurrency = (updates: Partial<CurrencyState>) => {
        setCurrencyState(prev => ({ ...prev, ...updates }));
    };

    const setComparisonMode = (mode: ComparisonMode) => {
        setInvestmentState(prev => {
            const updates: Partial<InvestmentState> = { comparisonMode: mode };
            // Auto-update linkedToLoan based on mode
            if (mode === 'loan_lumpsum_sip') {
                updates.lumpsum = { ...prev.lumpsum, linkedToLoan: true };
            } else if (mode === 'lumpsum_sip') {
                updates.lumpsum = { ...prev.lumpsum, linkedToLoan: false };
            }
            // For other modes, we keep existing linked state or could force it off. 
            // Keeping it as is allows flexibility unless specific behavior needed.
            return {
                ...prev,
                ...updates,
            };
        });
    };

    const updateAllocation = (mode: InvestmentMode, index: number, updates: Partial<InvestmentAllocation>) => {
        setInvestmentState(prev => {
            const stateKey = mode === 'lumpsum' ? 'lumpsum' : 'sip';
            const currentState = prev[stateKey];
            const newAllocations = [...currentState.allocations];
            newAllocations[index] = { ...newAllocations[index], ...updates };
            return {
                ...prev,
                [stateKey]: { ...currentState, allocations: newAllocations },
            };
        });
    };

    const addAllocation = (mode: InvestmentMode, instrumentId: string) => {
        const instrument = INVESTMENT_INSTRUMENTS.find(i => i.id === instrumentId);
        if (!instrument) return;

        setInvestmentState(prev => {
            const stateKey = mode === 'lumpsum' ? 'lumpsum' : 'sip';
            const currentState = prev[stateKey];
            // Count existing instances of this instrument
            const existingCount = currentState.allocations.filter(a => a.instrumentId === instrumentId).length;
            const instanceNum = existingCount + 1;
            return {
                ...prev,
                [stateKey]: {
                    ...currentState,
                    allocations: [
                        ...currentState.allocations,
                        createDefaultAllocation(instrumentId, instanceNum),
                    ],
                },
            };
        });
    };

    const removeAllocation = (mode: InvestmentMode, index: number) => {
        setInvestmentState(prev => {
            const stateKey = mode === 'lumpsum' ? 'lumpsum' : 'sip';
            const currentState = prev[stateKey];
            return {
                ...prev,
                [stateKey]: {
                    ...currentState,
                    allocations: currentState.allocations.filter((_, i) => i !== index),
                },
            };
        });
    };

    const recalculateAllocations = (mode: InvestmentMode, inputMode: 'percentage' | 'amount', newTotal?: number) => {
        setInvestmentState(prev => {
            const stateKey = mode === 'lumpsum' ? 'lumpsum' : 'sip';
            const currentState = prev[stateKey];
            const total = mode === 'lumpsum'
                ? (newTotal ?? (currentState as LumpsumState).totalAmount)
                : (newTotal ?? (currentState as SIPState).monthlyAmount);

            if (inputMode === 'percentage') {
                const newAllocations = currentState.allocations.map(a => ({
                    ...a,
                    amount: Math.round((a.percentage / 100) * total * 100) / 100,
                }));
                return {
                    ...prev,
                    [stateKey]: {
                        ...currentState,
                        ...(mode === 'lumpsum' ? { totalAmount: total } : { monthlyAmount: total }),
                        inputMode,
                        allocations: newAllocations,
                    },
                };
            } else {
                const sumAmounts = currentState.allocations.reduce((sum, a) => sum + a.amount, 0);
                const newAllocations = currentState.allocations.map(a => ({
                    ...a,
                    percentage: sumAmounts > 0 ? Math.round((a.amount / sumAmounts) * 10000) / 100 : 0,
                }));
                return {
                    ...prev,
                    [stateKey]: {
                        ...currentState,
                        ...(mode === 'lumpsum' ? { totalAmount: sumAmounts } : { monthlyAmount: sumAmounts }),
                        inputMode,
                        allocations: newAllocations,
                    },
                };
            }
        });
    };

    const resetAll = () => {
        setLoanState(defaultLoanState);
        setInvestmentState(defaultInvestmentState);
        setCurrencyState(defaultCurrencyState);
    };

    return (
        <AppContext.Provider value={{
            loan,
            investment,
            currency,
            setLoan,
            setInvestment,
            setLumpsum,
            setSIP,
            setComparisonMode,
            setCurrency,
            updateAllocation,
            addAllocation,
            removeAllocation,
            recalculateAllocations,
            resetAll,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppState must be used within AppProvider');
    }
    return context;
}
