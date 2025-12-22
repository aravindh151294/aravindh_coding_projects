'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Input, Select, Toggle, Hint, StatCard, Tabs } from '@/components/ui';
import { AllocationChart } from '@/components/charts';
import { useAppState, InvestmentAllocation } from '@/context/AppContext';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import { COMPOUNDING_OPTIONS, HINTS } from '@/lib/constants';
import {
    calculatePortfolioMaturity,
    calculateWeightedAverageRate,
    calculateSIPPortfolioMaturity,
    calculateWeightedSIPRate,
} from '@/lib/calculations';
import { getInstrumentById, getInstrumentsByMode, RISK_LABELS, InvestmentMode } from '@/lib/riskProfiles';

export default function InvestmentPage() {
    const {
        investment,
        setInvestment,
        setLumpsum,
        setSIP,
        updateAllocation,
        addAllocation,
        removeAllocation,
        recalculateAllocations,
        loan,
        currency,
    } = useAppState();
    const { formatEUR, formatINR, formatPercent } = useFormatters();

    const convertToINR = (eur: number) => eur * currency.eurToInr;

    // Lumpsum calculations
    const lumpsumResult = useMemo(() => {
        const totalAmount = investment.lumpsum.linkedToLoan
            ? loan.principal
            : investment.lumpsum.totalAmount;

        const allocationsWithTax = investment.lumpsum.allocations.map(a => ({
            ...a,
            amount: (a.percentage / 100) * totalAmount,
        }));

        const result = calculatePortfolioMaturity(
            totalAmount,
            allocationsWithTax,
            investment.termMonths,
            investment.compoundingFrequency
        );

        // Apply taxes per allocation
        let totalTaxPaid = 0;
        const afterTaxInterest = allocationsWithTax.reduce((sum, a, i) => {
            const allocationInterest = result.allocationReturns[i]?.interest || 0;
            const tax = allocationInterest * (a.taxRate / 100);
            totalTaxPaid += tax;
            return sum + (allocationInterest - tax);
        }, 0);

        return {
            ...result,
            totalAmount,
            totalTaxPaid,
            afterTaxInterest,
            netMaturity: totalAmount + afterTaxInterest,
        };
    }, [investment.lumpsum, investment.termMonths, investment.compoundingFrequency, loan.principal]);

    // SIP calculations
    const sipResult = useMemo(() => {
        const allocationsWithTax = investment.sip.allocations.map(a => ({
            instrumentId: a.instrumentId,
            amount: (a.percentage / 100) * investment.sip.monthlyAmount,
            percentage: a.percentage,
            annualRate: a.annualRate,
            taxRate: a.taxRate,
        }));

        return calculateSIPPortfolioMaturity(
            investment.sip.monthlyAmount,
            allocationsWithTax,
            investment.termMonths,
            true // Apply tax
        );
    }, [investment.sip, investment.termMonths]);

    // Risk calculation helper
    const calculateRiskScore = (allocations: InvestmentAllocation[]) => {
        const riskScoreMap: Record<string, number> = {
            'very_low': 10, 'low': 25, 'medium': 50, 'medium_high': 70, 'high': 85, 'very_high': 95
        };
        const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);
        if (totalPct === 0) return 0;
        return allocations.reduce((sum, a) => {
            const inst = getInstrumentById(a.instrumentId);
            return sum + (a.percentage * (inst ? riskScoreMap[inst.riskLevel] : 50));
        }, 0) / totalPct;
    };

    const lumpsumRisk = calculateRiskScore(investment.lumpsum.allocations);
    const sipRisk = calculateRiskScore(investment.sip.allocations);

    // Render allocation row for either mode
    const renderAllocationRow = (mode: InvestmentMode, alloc: InvestmentAllocation, index: number) => {
        const inst = getInstrumentById(alloc.instrumentId);
        if (!inst) return null;

        return (
            <div key={`${alloc.instrumentId}-${index}`} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-800">{inst.name}</h4>
                        <span className="text-xs text-gray-500">{RISK_LABELS[inst.riskLevel]} Risk</span>
                    </div>
                    {(mode === 'lumpsum' ? investment.lumpsum.allocations : investment.sip.allocations).length > 1 && (
                        <button
                            onClick={() => removeAllocation(mode, index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        label="Rate (%)"
                        type="number"
                        step="0.1"
                        value={alloc.annualRate}
                        onChange={(e) => updateAllocation(mode, index, { annualRate: Number(e.target.value) })}
                    />
                    <Input
                        label="Allocation (%)"
                        type="number"
                        step="1"
                        value={alloc.percentage}
                        onChange={(e) => updateAllocation(mode, index, { percentage: Number(e.target.value) })}
                    />
                    <Input
                        label="Tax (%)"
                        type="number"
                        step="1"
                        value={alloc.taxRate}
                        onChange={(e) => updateAllocation(mode, index, { taxRate: Number(e.target.value) })}
                    />
                </div>
            </div>
        );
    };

    // Available instruments for adding
    const getLumpsumInstruments = () => getInstrumentsByMode('lumpsum').filter(
        i => !investment.lumpsum.allocations.some(a => a.instrumentId === i.id)
    );
    const getSIPInstruments = () => getInstrumentsByMode('sip').filter(
        i => !investment.sip.allocations.some(a => a.instrumentId === i.id)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Investment Planner</h1>
                    <p className="text-gray-600 text-sm">Compare Lumpsum and SIP strategies</p>
                </div>

                {/* Tabs */}
                <Tabs
                    tabs={[
                        { id: 'lumpsum', label: 'Lumpsum' },
                        { id: 'sip', label: 'SIP' },
                    ]}
                    activeTab={investment.activeTab}
                    onChange={(tab) => setInvestment({ activeTab: tab as 'lumpsum' | 'sip' })}
                />

                {/* Shared Settings */}
                <Card>
                    <CardHeader title="Investment Settings" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Select
                            label="Duration"
                            options={[
                                { value: '12', label: '1 Year' },
                                { value: '24', label: '2 Years' },
                                { value: '36', label: '3 Years' },
                                { value: '60', label: '5 Years' },
                                { value: '84', label: '7 Years' },
                                { value: '120', label: '10 Years' },
                            ]}
                            value={investment.termMonths.toString()}
                            onChange={(e) => setInvestment({ termMonths: Number(e.target.value) })}
                        />
                        <Select
                            label="Compounding"
                            options={[...COMPOUNDING_OPTIONS]}
                            value={investment.compoundingFrequency}
                            onChange={(e) => setInvestment({ compoundingFrequency: e.target.value as 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' })}
                        />
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <Toggle
                            label="Adjust for Inflation"
                            checked={investment.adjustInflation}
                            onChange={(v) => setInvestment({ adjustInflation: v })}
                        />
                        {investment.adjustInflation && (
                            <Input
                                label="Inflation %"
                                type="number"
                                step="0.1"
                                value={investment.inflationRate}
                                onChange={(e) => setInvestment({ inflationRate: Number(e.target.value) })}
                                className="w-24"
                            />
                        )}
                    </div>
                </Card>

                {/* Lumpsum Tab Content */}
                {investment.activeTab === 'lumpsum' && (
                    <>
                        <Card>
                            <CardHeader title="Lumpsum Investment" subtitle="One-time investment allocation" />

                            {/* Linked to Loan Toggle */}
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-blue-800">Linked to Loan</span>
                                        <p className="text-xs text-blue-600">Amount matches your loan principal</p>
                                    </div>
                                    <Toggle
                                        label=""
                                        checked={investment.lumpsum.linkedToLoan}
                                        onChange={(v) => setLumpsum({ linkedToLoan: v })}
                                    />
                                </div>
                            </div>

                            {/* Amount Input */}
                            <Input
                                label="Total Investment"
                                type="number"
                                prefix="€"
                                value={investment.lumpsum.linkedToLoan ? loan.principal : investment.lumpsum.totalAmount}
                                disabled={investment.lumpsum.linkedToLoan}
                                onChange={(e) => setLumpsum({ totalAmount: Number(e.target.value) })}
                            />
                            {investment.lumpsum.linkedToLoan && (
                                <p className="text-xs text-gray-500 mt-1">
                                    ℹ️ Amount is locked to loan principal ({formatEUR(loan.principal)})
                                </p>
                            )}

                            {/* Allocations */}
                            <div className="mt-4 space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Allocations</h4>
                                {investment.lumpsum.allocations.map((a, i) => renderAllocationRow('lumpsum', a, i))}

                                {getLumpsumInstruments().length > 0 && (
                                    <Select
                                        label="Add Instrument"
                                        options={[
                                            { value: '', label: 'Select to add...' },
                                            ...getLumpsumInstruments().map(i => ({ value: i.id, label: i.name }))
                                        ]}
                                        value=""
                                        onChange={(e) => e.target.value && addAllocation('lumpsum', e.target.value)}
                                    />
                                )}
                            </div>
                        </Card>

                        {/* Lumpsum Results */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <StatCard
                                label="Maturity Value"
                                value={formatEUR(lumpsumResult.netMaturity)}
                                subValue={formatINR(convertToINR(lumpsumResult.netMaturity))}
                                trend="up"
                            />
                            <StatCard
                                label="Total Returns"
                                value={formatEUR(lumpsumResult.afterTaxInterest)}
                                subValue={`After ${formatEUR(lumpsumResult.totalTaxPaid)} tax`}
                                trend="up"
                            />
                            <StatCard
                                label="Weighted CAGR"
                                value={formatPercent(lumpsumResult.weightedRate)}
                                subValue={`Risk: ${Math.round(lumpsumRisk)}%`}
                            />
                        </div>
                    </>
                )}

                {/* SIP Tab Content */}
                {investment.activeTab === 'sip' && (
                    <>
                        <Card>
                            <CardHeader title="SIP Investment" subtitle="Monthly systematic investment" />

                            <Input
                                label="Monthly Amount"
                                type="number"
                                prefix="€"
                                value={investment.sip.monthlyAmount}
                                onChange={(e) => setSIP({ monthlyAmount: Number(e.target.value) })}
                            />

                            {/* Allocations */}
                            <div className="mt-4 space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Allocations</h4>
                                {investment.sip.allocations.map((a, i) => renderAllocationRow('sip', a, i))}

                                {getSIPInstruments().length > 0 && (
                                    <Select
                                        label="Add Instrument"
                                        options={[
                                            { value: '', label: 'Select to add...' },
                                            ...getSIPInstruments().map(i => ({ value: i.id, label: i.name }))
                                        ]}
                                        value=""
                                        onChange={(e) => e.target.value && addAllocation('sip', e.target.value)}
                                    />
                                )}
                            </div>
                        </Card>

                        {/* SIP Results */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <StatCard
                                label="Maturity Value"
                                value={formatEUR(sipResult.maturityAmount)}
                                subValue={formatINR(convertToINR(sipResult.maturityAmount))}
                                trend="up"
                            />
                            <StatCard
                                label="Total Invested"
                                value={formatEUR(sipResult.totalInvested)}
                                subValue={`${investment.termMonths} months × ${formatEUR(investment.sip.monthlyAmount)}`}
                            />
                            <StatCard
                                label="Weighted XIRR"
                                value={formatPercent(sipResult.weightedRate)}
                                subValue={`Risk: ${Math.round(sipRisk)}%`}
                            />
                        </div>

                        {/* SIP Gain Card */}
                        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                            <div className="text-center">
                                <p className="text-white/80 text-sm">Total Gain (After Tax)</p>
                                <p className="text-3xl font-bold">{formatEUR(sipResult.totalGain)}</p>
                                <p className="text-sm text-white/70 mt-1">
                                    Return on Investment: {formatPercent((sipResult.totalGain / sipResult.totalInvested) * 100)}
                                </p>
                            </div>
                        </Card>
                    </>
                )}

                {/* Summary Comparison */}
                <Card>
                    <CardHeader title="Quick Comparison" subtitle="Lumpsum vs SIP at a glance" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <h4 className="font-semibold text-blue-800">Lumpsum</h4>
                            <p className="text-2xl font-bold text-blue-900">{formatEUR(lumpsumResult.netMaturity)}</p>
                            <p className="text-sm text-blue-600">Invested: {formatEUR(lumpsumResult.totalAmount)}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                            <h4 className="font-semibold text-green-800">SIP</h4>
                            <p className="text-2xl font-bold text-green-900">{formatEUR(sipResult.maturityAmount)}</p>
                            <p className="text-sm text-green-600">Invested: {formatEUR(sipResult.totalInvested)}</p>
                        </div>
                    </div>
                    <Hint type="tip" className="mt-4">
                        💡 Go to the Compare page for detailed analysis including loan scenarios and break-even timeline.
                    </Hint>
                </Card>
            </div>
        </div>
    );
}
