'use client';

import { useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculatePortfolioMaturity, calculateSIPPortfolioMaturity } from '@/lib/calculations';

export interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    growthData: { month: number; amount: number }[];
    weightedRate: number;
    totalAmount: number;
}

/**
 * Hook for Lumpsum investment calculations
 * Updated for the new Lumpsum/SIP architecture
 */
export function useFDCalculator() {
    const { investment, setLumpsum, currency, setCurrency, loan } = useAppState();

    // Get the effective lumpsum amount (linked to loan or custom)
    const totalAmount = investment.lumpsum.linkedToLoan
        ? loan.principal
        : investment.lumpsum.totalAmount;

    const result = useMemo<FDResult>(() => {
        const allocationsWithAmount = investment.lumpsum.allocations.map(a => ({
            ...a,
            amount: (a.percentage / 100) * totalAmount,
        }));

        const portfolioResult = calculatePortfolioMaturity(
            totalAmount,
            allocationsWithAmount,
            investment.termMonths,
            investment.compoundingFrequency
        );

        return {
            maturityAmount: portfolioResult.maturityAmount,
            totalInterest: portfolioResult.totalInterest,
            growthData: portfolioResult.growthData,
            weightedRate: portfolioResult.weightedRate,
            totalAmount,
        };
    }, [investment.lumpsum, investment.termMonths, investment.compoundingFrequency, totalAmount]);

    // Provide backward-compatible inputs object
    const inputs = {
        principal: totalAmount,
        termMonths: investment.termMonths,
        linkedToLoan: investment.lumpsum.linkedToLoan,
    };

    return {
        inputs,
        result,
        exchangeRate: currency.eurToInr,
        setExchangeRate: (rate: number) => setCurrency({ eurToInr: rate }),
    };
}
