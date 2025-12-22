'use client';

import { useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculatePortfolioMaturity, calculateFDTax, adjustForInflation } from '@/lib/calculations';

export interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    periodicPayout: number;
    growthData: { month: number; amount: number }[];
    taxAmount: number;
    afterTaxInterest: number;
    inflationAdjustedAmount: number;
    effectiveReturn: number;
    weightedRate: number;
}

/**
 * Backward-compatible hook that wraps the new investment state
 * for components that still expect the old FD interface
 */
export function useFDCalculator() {
    const { investment, setInvestment, currency, setCurrency } = useAppState();

    // Create a compatible inputs object
    const inputs = {
        principal: investment.totalAmount,
        annualRate: investment.allocations[0]?.annualRate || 7,
        termMonths: investment.termMonths,
        compoundingFrequency: investment.compoundingFrequency,
        payoutType: investment.payoutType,
        taxRate: investment.taxRate,
        inflationRate: investment.inflationRate,
        includeTax: investment.includeTax,
        adjustInflation: investment.adjustInflation,
    };

    const result = useMemo<FDResult>(() => {
        const portfolioResult = calculatePortfolioMaturity(
            investment.totalAmount,
            investment.allocations,
            investment.termMonths,
            investment.compoundingFrequency
        );

        const taxAmount = investment.includeTax
            ? calculateFDTax(portfolioResult.totalInterest, investment.taxRate)
            : 0;
        const afterTaxInterest = portfolioResult.totalInterest - taxAmount;

        const years = investment.termMonths / 12;
        const inflationAdjustedAmount = investment.adjustInflation
            ? adjustForInflation(portfolioResult.maturityAmount - taxAmount, years, investment.inflationRate)
            : portfolioResult.maturityAmount - taxAmount;

        const effectiveReturn = investment.adjustInflation
            ? portfolioResult.weightedRate - investment.inflationRate
            : portfolioResult.weightedRate;

        return {
            maturityAmount: portfolioResult.maturityAmount,
            totalInterest: portfolioResult.totalInterest,
            periodicPayout: 0, // Periodic payout handled differently in portfolio
            growthData: portfolioResult.growthData,
            taxAmount,
            afterTaxInterest,
            inflationAdjustedAmount,
            effectiveReturn,
            weightedRate: portfolioResult.weightedRate,
        };
    }, [investment]);

    return {
        inputs,
        result,
        exchangeRate: currency.eurToInr,
        setExchangeRate: (rate: number) => setCurrency({ eurToInr: rate }),
    };
}
