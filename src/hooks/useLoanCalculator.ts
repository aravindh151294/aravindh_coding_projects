'use client';

import { useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import {
    calculateScenarioA,
    calculateScenarioB,
    calculateScenarioC,
    MonthlyScheduleEntry
} from '@/lib/calculations';
import { DEFAULT_LOAN } from '@/lib/constants';

export interface ScenarioResult {
    schedule: MonthlyScheduleEntry[];
    totalInterest: number;
    totalPayment: number;
    emi: number;
    monthsSaved?: number;
    totalPenalty?: number;
}

export function useLoanCalculator() {
    const { loan, setLoan, currency, setCurrency } = useAppState();

    const updateInput = <K extends keyof typeof loan>(key: K, value: typeof loan[K]) => {
        setLoan({ [key]: value });
    };

    const resetInputs = () => {
        setLoan({
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
        return calculateScenarioA(loan.principal, loan.annualRate, loan.termMonths);
    }, [loan.principal, loan.annualRate, loan.termMonths]);

    const scenarioB = useMemo<ScenarioResult>(() => {
        return calculateScenarioB(
            loan.principal,
            loan.annualRate,
            loan.termMonths,
            loan.prepaymentAmount,
            loan.prepaymentMonth,
            loan.penaltyRate,
            loan.extraMonthlyPayment,
            loan.extraPaymentTiming
        );
    }, [
        loan.principal,
        loan.annualRate,
        loan.termMonths,
        loan.prepaymentAmount,
        loan.prepaymentMonth,
        loan.penaltyRate,
        loan.extraMonthlyPayment,
        loan.extraPaymentTiming
    ]);

    const scenarioC = useMemo<ScenarioResult>(() => {
        return calculateScenarioC(
            loan.principal,
            loan.annualRate,
            loan.termMonths,
            loan.extraMonthlyPayment
        );
    }, [loan.principal, loan.annualRate, loan.termMonths, loan.extraMonthlyPayment]);

    const savings = useMemo(() => {
        const savingsB = scenarioA.totalInterest - scenarioB.totalInterest - (scenarioB.totalPenalty || 0);
        const savingsC = scenarioA.totalInterest - scenarioC.totalInterest;
        return { savingsB, savingsC };
    }, [scenarioA, scenarioB, scenarioC]);

    return {
        inputs: loan,
        updateInput,
        resetInputs,
        scenarioA,
        scenarioB,
        scenarioC,
        savings,
        exchangeRate: currency.eurToInr,
        setExchangeRate: (rate: number) => setCurrency({ eurToInr: rate }),
    };
}
