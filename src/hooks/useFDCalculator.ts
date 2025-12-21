'use client';

import { useState, useMemo } from 'react';
import { calculateFDMaturity, calculateFDTax, adjustForInflation } from '@/lib/calculations';
import { DEFAULT_FD } from '@/lib/constants';

export interface FDInputs {
    principal: number;
    annualRate: number;
    termMonths: number;
    compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    taxRate: number;
    inflationRate: number;
    includeTax: boolean;
    adjustInflation: boolean;
}

export interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    growthData: { month: number; amount: number }[];
    taxAmount: number;
    afterTaxInterest: number;
    inflationAdjustedAmount: number;
    effectiveReturn: number;
}

export function useFDCalculator() {
    const [inputs, setInputs] = useState<FDInputs>({
        principal: DEFAULT_FD.principal,
        annualRate: DEFAULT_FD.annualRate,
        termMonths: DEFAULT_FD.termMonths,
        compoundingFrequency: DEFAULT_FD.compoundingFrequency,
        taxRate: DEFAULT_FD.taxRate,
        inflationRate: DEFAULT_FD.inflationRate,
        includeTax: false,
        adjustInflation: false,
    });

    const updateInput = <K extends keyof FDInputs>(key: K, value: FDInputs[K]) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const resetInputs = () => {
        setInputs({
            principal: DEFAULT_FD.principal,
            annualRate: DEFAULT_FD.annualRate,
            termMonths: DEFAULT_FD.termMonths,
            compoundingFrequency: DEFAULT_FD.compoundingFrequency,
            taxRate: DEFAULT_FD.taxRate,
            inflationRate: DEFAULT_FD.inflationRate,
            includeTax: false,
            adjustInflation: false,
        });
    };

    const result = useMemo<FDResult>(() => {
        const { maturityAmount, totalInterest, growthData } = calculateFDMaturity(
            inputs.principal,
            inputs.annualRate,
            inputs.termMonths,
            inputs.compoundingFrequency
        );

        const taxAmount = inputs.includeTax ? calculateFDTax(totalInterest, inputs.taxRate) : 0;
        const afterTaxInterest = totalInterest - taxAmount;

        const years = inputs.termMonths / 12;
        const inflationAdjustedAmount = inputs.adjustInflation
            ? adjustForInflation(maturityAmount - taxAmount, years, inputs.inflationRate)
            : maturityAmount - taxAmount;

        const effectiveReturn = inputs.adjustInflation
            ? inputs.annualRate - inputs.inflationRate
            : inputs.annualRate;

        return {
            maturityAmount,
            totalInterest,
            growthData,
            taxAmount,
            afterTaxInterest,
            inflationAdjustedAmount,
            effectiveReturn,
        };
    }, [inputs]);

    return {
        inputs,
        updateInput,
        resetInputs,
        result,
    };
}
