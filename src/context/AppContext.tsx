'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_LOAN, DEFAULT_CURRENCY } from '@/lib/constants';
import { INVESTMENT_INSTRUMENTS } from '@/lib/riskProfiles';

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

// Investment Allocation
export interface InvestmentAllocation {
    instrumentId: string;
    amount: number;
    percentage: number;
    annualRate: number;
    country?: string;
}

// Investment State
export interface InvestmentState {
    totalAmount: number;
    termMonths: number;
    inputMode: 'percentage' | 'amount';
    allocations: InvestmentAllocation[];
    compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    payoutType: 'cumulative' | 'monthly' | 'quarterly' | 'yearly';
    taxRate: number;
    inflationRate: number;
    includeTax: boolean;
    adjustInflation: boolean;
    linkedToLoan: boolean; // For comparison: use loan amount as investment
}

// Locale type for number formatting
export type LocalePreference = 'en-US' | 'de-DE' | 'browser';

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
    setCurrency: (currency: Partial<CurrencyState>) => void;
    updateAllocation: (index: number, updates: Partial<InvestmentAllocation>) => void;
    addAllocation: (instrumentId: string) => void;
    removeAllocation: (index: number) => void;
    recalculateAllocations: (mode: 'percentage' | 'amount', newTotal?: number) => void;
    resetAll: () => void;
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

const defaultInvestmentState: InvestmentState = {
    totalAmount: 100000,
    termMonths: 60,
    inputMode: 'percentage',
    allocations: [
        {
            instrumentId: 'fd',
            amount: 100000,
            percentage: 100,
            annualRate: INVESTMENT_INSTRUMENTS[0].defaultRate,
        },
    ],
    compoundingFrequency: 'quarterly',
    payoutType: 'cumulative',
    taxRate: 30,
    inflationRate: 6,
    includeTax: false,
    adjustInflation: false,
    linkedToLoan: false,
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

    const setCurrency = (updates: Partial<CurrencyState>) => {
        setCurrencyState(prev => ({ ...prev, ...updates }));
    };

    const updateAllocation = (index: number, updates: Partial<InvestmentAllocation>) => {
        setInvestmentState(prev => {
            const newAllocations = [...prev.allocations];
            newAllocations[index] = { ...newAllocations[index], ...updates };
            return { ...prev, allocations: newAllocations };
        });
    };

    const addAllocation = (instrumentId: string) => {
        const instrument = INVESTMENT_INSTRUMENTS.find(i => i.id === instrumentId);
        if (!instrument) return;

        setInvestmentState(prev => ({
            ...prev,
            allocations: [
                ...prev.allocations,
                {
                    instrumentId,
                    amount: 0,
                    percentage: 0,
                    annualRate: instrument.defaultRate,
                },
            ],
        }));
    };

    const removeAllocation = (index: number) => {
        setInvestmentState(prev => ({
            ...prev,
            allocations: prev.allocations.filter((_, i) => i !== index),
        }));
    };

    const recalculateAllocations = (mode: 'percentage' | 'amount', newTotal?: number) => {
        setInvestmentState(prev => {
            const total = newTotal ?? prev.totalAmount;

            if (mode === 'percentage') {
                // Calculate amounts from percentages
                const newAllocations = prev.allocations.map(a => ({
                    ...a,
                    amount: Math.round((a.percentage / 100) * total * 100) / 100,
                }));
                return { ...prev, totalAmount: total, allocations: newAllocations, inputMode: mode };
            } else {
                // Calculate percentages from amounts
                const sumAmounts = prev.allocations.reduce((sum, a) => sum + a.amount, 0);
                const newAllocations = prev.allocations.map(a => ({
                    ...a,
                    percentage: sumAmounts > 0 ? Math.round((a.amount / sumAmounts) * 10000) / 100 : 0,
                }));
                return { ...prev, totalAmount: sumAmounts, allocations: newAllocations, inputMode: mode };
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
