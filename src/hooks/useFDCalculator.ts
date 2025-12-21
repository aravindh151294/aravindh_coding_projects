'use client';

import { useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { calculateFDMaturity, calculateFDTax, adjustForInflation } from '@/lib/calculations';
import { DEFAULT_FD } from '@/lib/constants';

export interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    periodicPayout: number;
    growthData: { month: number; amount: number }[];
    taxAmount: number;
    afterTaxInterest: number;
    inflationAdjustedAmount: number;
    effectiveReturn: number;
}

export function useFDCalculator() {
    const { fd, setFD, currency, setCurrency } = useAppState();

    const updateInput = <K extends keyof typeof fd>(key: K, value: typeof fd[K]) => {
        setFD({ [key]: value });
    };

    const resetInputs = () => {
        setFD({
            principal: DEFAULT_FD.principal,
            annualRate: DEFAULT_FD.annualRate,
            termMonths: DEFAULT_FD.termMonths,
            compoundingFrequency: DEFAULT_FD.compoundingFrequency,
            payoutType: 'cumulative',
            taxRate: DEFAULT_FD.taxRate,
            inflationRate: DEFAULT_FD.inflationRate,
            includeTax: false,
            adjustInflation: false,
        });
    };

    const result = useMemo<FDResult>(() => {
        const { maturityAmount, totalInterest, periodicPayout, growthData } = calculateFDMaturity(
            fd.principal,
            fd.annualRate,
            fd.termMonths,
            fd.compoundingFrequency,
            fd.payoutType
        );

        const taxAmount = fd.includeTax ? calculateFDTax(totalInterest, fd.taxRate) : 0;
        const afterTaxInterest = totalInterest - taxAmount;

        const years = fd.termMonths / 12;
        const inflationAdjustedAmount = fd.adjustInflation
            ? adjustForInflation(maturityAmount - taxAmount, years, fd.inflationRate)
            : maturityAmount - taxAmount;

        const effectiveReturn = fd.adjustInflation
            ? fd.annualRate - fd.inflationRate
            : fd.annualRate;

        return {
            maturityAmount,
            totalInterest,
            periodicPayout,
            growthData,
            taxAmount,
            afterTaxInterest,
            inflationAdjustedAmount,
            effectiveReturn,
        };
    }, [fd]);

    return {
        inputs: fd,
        updateInput,
        resetInputs,
        result,
        exchangeRate: currency.eurToInr,
        setExchangeRate: (rate: number) => setCurrency({ eurToInr: rate }),
    };
}
