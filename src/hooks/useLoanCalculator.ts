'use client';

import { useState, useMemo } from 'react';
import {
    calculateScenarioA,
    calculateScenarioB,
    calculateScenarioC,
    MonthlyScheduleEntry
} from '@/lib/calculations';
import { DEFAULT_LOAN } from '@/lib/constants';

export interface LoanInputs {
    principal: number;
    annualRate: number;
    termMonths: number;
    prepaymentAmount: number;
    prepaymentMonth: number;
    penaltyRate: number;
    extraMonthlyPayment: number;
    extraPaymentTiming: 'before' | 'after' | 'both';
}

export interface ScenarioResult {
    schedule: MonthlyScheduleEntry[];
    totalInterest: number;
    totalPayment: number;
    emi: number;
    monthsSaved?: number;
    totalPenalty?: number;
}

export function useLoanCalculator() {
    const [inputs, setInputs] = useState<LoanInputs>({
        principal: DEFAULT_LOAN.principal,
        annualRate: DEFAULT_LOAN.annualRate,
        termMonths: DEFAULT_LOAN.termMonths,
        prepaymentAmount: DEFAULT_LOAN.prepaymentAmount,
        prepaymentMonth: DEFAULT_LOAN.prepaymentMonth,
        penaltyRate: DEFAULT_LOAN.penaltyRate,
        extraMonthlyPayment: DEFAULT_LOAN.extraMonthlyPayment,
        extraPaymentTiming: 'both',
    });

    const updateInput = <K extends keyof LoanInputs>(key: K, value: LoanInputs[K]) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const resetInputs = () => {
        setInputs({
            principal: DEFAULT_LOAN.principal,
            annualRate: DEFAULT_LOAN.annualRate,
            termMonths: DEFAULT_LOAN.termMonths,
            prepaymentAmount: DEFAULT_LOAN.prepaymentAmount,
            prepaymentMonth: DEFAULT_LOAN.prepaymentMonth,
            penaltyRate: DEFAULT_LOAN.penaltyRate,
            extraMonthlyPayment: DEFAULT_LOAN.extraMonthlyPayment,
            extraPaymentTiming: 'both',
        });
    };

    const scenarioA = useMemo<ScenarioResult>(() => {
        return calculateScenarioA(inputs.principal, inputs.annualRate, inputs.termMonths);
    }, [inputs.principal, inputs.annualRate, inputs.termMonths]);

    const scenarioB = useMemo<ScenarioResult>(() => {
        return calculateScenarioB(
            inputs.principal,
            inputs.annualRate,
            inputs.termMonths,
            inputs.prepaymentAmount,
            inputs.prepaymentMonth,
            inputs.penaltyRate,
            inputs.extraMonthlyPayment,
            inputs.extraPaymentTiming
        );
    }, [
        inputs.principal,
        inputs.annualRate,
        inputs.termMonths,
        inputs.prepaymentAmount,
        inputs.prepaymentMonth,
        inputs.penaltyRate,
        inputs.extraMonthlyPayment,
        inputs.extraPaymentTiming
    ]);

    const scenarioC = useMemo<ScenarioResult>(() => {
        return calculateScenarioC(
            inputs.principal,
            inputs.annualRate,
            inputs.termMonths,
            inputs.extraMonthlyPayment
        );
    }, [inputs.principal, inputs.annualRate, inputs.termMonths, inputs.extraMonthlyPayment]);

    const savings = useMemo(() => {
        const savingsB = scenarioA.totalInterest - scenarioB.totalInterest - (scenarioB.totalPenalty || 0);
        const savingsC = scenarioA.totalInterest - scenarioC.totalInterest;
        return { savingsB, savingsC };
    }, [scenarioA, scenarioB, scenarioC]);

    return {
        inputs,
        updateInput,
        resetInputs,
        scenarioA,
        scenarioB,
        scenarioC,
        savings,
    };
}
