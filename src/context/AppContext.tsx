'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_LOAN, DEFAULT_FD, DEFAULT_CURRENCY } from '@/lib/constants';

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

// FD State
export interface FDState {
    principal: number;
    annualRate: number;
    termMonths: number;
    compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    payoutType: 'cumulative' | 'monthly' | 'quarterly' | 'yearly';
    taxRate: number;
    inflationRate: number;
    includeTax: boolean;
    adjustInflation: boolean;
}

// Currency State
export interface CurrencyState {
    eurToInr: number;
}

// Combined App State
interface AppState {
    loan: LoanState;
    fd: FDState;
    currency: CurrencyState;
    setLoan: (loan: Partial<LoanState>) => void;
    setFD: (fd: Partial<FDState>) => void;
    setCurrency: (currency: Partial<CurrencyState>) => void;
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

const defaultFDState: FDState = {
    principal: DEFAULT_FD.principal,
    annualRate: DEFAULT_FD.annualRate,
    termMonths: DEFAULT_FD.termMonths,
    compoundingFrequency: DEFAULT_FD.compoundingFrequency,
    payoutType: 'cumulative', // Default: reinvest all interest (cumulative)
    taxRate: DEFAULT_FD.taxRate,
    inflationRate: DEFAULT_FD.inflationRate,
    includeTax: false,
    adjustInflation: false,
};

const defaultCurrencyState: CurrencyState = {
    eurToInr: DEFAULT_CURRENCY.eurToInr,
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [loan, setLoanState] = useState<LoanState>(defaultLoanState);
    const [fd, setFDState] = useState<FDState>(defaultFDState);
    const [currency, setCurrencyState] = useState<CurrencyState>(defaultCurrencyState);

    const setLoan = (updates: Partial<LoanState>) => {
        setLoanState(prev => ({ ...prev, ...updates }));
    };

    const setFD = (updates: Partial<FDState>) => {
        setFDState(prev => ({ ...prev, ...updates }));
    };

    const setCurrency = (updates: Partial<CurrencyState>) => {
        setCurrencyState(prev => ({ ...prev, ...updates }));
    };

    const resetAll = () => {
        setLoanState(defaultLoanState);
        setFDState(defaultFDState);
        setCurrencyState(defaultCurrencyState);
    };

    return (
        <AppContext.Provider value={{ loan, fd, currency, setLoan, setFD, setCurrency, resetAll }}>
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
